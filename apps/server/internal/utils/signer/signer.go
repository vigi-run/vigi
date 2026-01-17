package signer

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/beevik/etree"
	"golang.org/x/crypto/pkcs12"
)

// LoadCertificate loads a certificate and private key from base64 encoded PFX data
func LoadCertificate(base64Data, password string) (*x509.Certificate, *rsa.PrivateKey, error) {
	pfxData, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to decode base64 pfx: %w", err)
	}

	// pkcs12.Decode returns private key, certificate, and potential error
	privateKey, cert, err := pkcs12.Decode(pfxData, password)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to decode pfx: %w", err)
	}

	rsaKey, ok := privateKey.(*rsa.PrivateKey)
	if !ok {
		return nil, nil, errors.New("private key is not RSA")
	}

	return cert, rsaKey, nil
}

// SignXML signs the XML using XMLDSig (SHA256)
// elementTag is the tag name of the element to be signed (e.g., "infDPS").
// The element MUST have an 'Id' attribute.
func SignXML(xmlBytes []byte, elementTag string, cert *x509.Certificate, privateKey *rsa.PrivateKey) ([]byte, error) {
	doc := etree.NewDocument()
	if err := doc.ReadFromBytes(xmlBytes); err != nil {
		return nil, err
	}

	// Find the element to sign
	elem := doc.FindElement("//" + elementTag)
	if elem == nil {
		return nil, fmt.Errorf("element %s not found", elementTag)
	}

	id := elem.SelectAttrValue("Id")
	if id == "" {
		return nil, fmt.Errorf("element %s has no Id attribute", elementTag)
	}

	// 1. Canonicalize the element to be signed
	canonicalized, err := canonicalize(elem)
	if err != nil {
		return nil, fmt.Errorf("failed to canonicalize element: %w", err)
	}

	// 2. Calculate Digest
	hasher := sha256.New()
	hasher.Write(canonicalized)
	digest := hasher.Sum(nil)
	digestValue := base64.StdEncoding.EncodeToString(digest)

	// 3. Construct SignedInfo
	// Note: We create it disconnected first, then canonicalize it
	signedInfo := etree.NewElement("SignedInfo")
	signedInfo.CreateAttr("xmlns", "http://www.w3.org/2000/09/xmldsig#")

	cm := signedInfo.CreateElement("CanonicalizationMethod")
	cm.CreateAttr("Algorithm", "http://www.w3.org/2001/10/xml-exc-c14n#")

	sm := signedInfo.CreateElement("SignatureMethod")
	sm.CreateAttr("Algorithm", "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")

	ref := signedInfo.CreateElement("Reference")
	ref.CreateAttr("URI", "#"+id)

	transforms := ref.CreateElement("Transforms")
	t1 := transforms.CreateElement("Transform")
	t1.CreateAttr("Algorithm", "http://www.w3.org/2001/10/xml-exc-c14n#")

	dm := ref.CreateElement("DigestMethod")
	dm.CreateAttr("Algorithm", "http://www.w3.org/2001/04/xmlenc#sha256")

	dv := ref.CreateElement("DigestValue")
	dv.SetText(digestValue)

	// 4. Canonicalize SignedInfo
	c14nSignedInfo, err := canonicalize(signedInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to canonicalize SignedInfo: %w", err)
	}

	// 5. Sign SignedInfo
	siHasher := sha256.New()
	siHasher.Write(c14nSignedInfo)
	siHash := siHasher.Sum(nil)

	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, siHash)
	if err != nil {
		return nil, fmt.Errorf("failed to sign: %w", err)
	}
	signatureValue := base64.StdEncoding.EncodeToString(signature)

	// 6. Construct Signature Element
	sig := etree.NewElement("Signature")
	sig.CreateAttr("xmlns", "http://www.w3.org/2000/09/xmldsig#")

	// We must add SignedInfo as a child of Signature.
	// IMPORTANT: Use the exact structure we canonicalized, or recreate it exactly.
	// etree AddChild moves the element.
	sig.AddChild(signedInfo)

	sigVal := sig.CreateElement("SignatureValue")
	sigVal.SetText(signatureValue)

	keyInfo := sig.CreateElement("KeyInfo")
	x509Data := keyInfo.CreateElement("X509Data")
	x509Cert := x509Data.CreateElement("X509Certificate")
	x509Cert.SetText(base64.StdEncoding.EncodeToString(cert.Raw))

	// 7. Append Signature to the document
	// For NFSe (DPS), Signature is usually appended to the parent of infDPS (i.e. DPS)
	parent := elem.Parent()
	if parent == nil {
		return nil, errors.New("cannot sign root element if it has no parent")
	}
	parent.AddChild(sig)

	// Return full XML
	doc.WriteSettings = etree.WriteSettings{
		CanonicalEndTags: true,
		CanonicalText:    true,
		CanonicalAttrVal: true,
	}
	return doc.WriteToBytes()
}

// canonicalize approximates Exclusive C14N
func canonicalize(el *etree.Element) ([]byte, error) {
	doc := etree.NewDocument()
	copyEl := el.Copy()
	doc.SetRoot(copyEl)

	doc.WriteSettings = etree.WriteSettings{
		CanonicalEndTags: true,
		CanonicalText:    true,
		CanonicalAttrVal: true,
		UseCRLF:          false, // LF only
	}
	return doc.WriteToBytes()
}
