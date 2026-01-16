export const isValidCPF = (cpf: string): boolean => {
  if (typeof cpf !== 'string') return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  const cpfArray = cpf.split('').map((el) => +el);
  const rest = (count: number) =>
    ((cpfArray
      .slice(0, count - 12)
      .reduce((s, el, i) => s + el * (count - i), 0) *
      10) %
      11) %
    10;
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
};

export const isValidCNPJ = (cnpj: string): boolean => {
  if (typeof cnpj !== 'string') return false;
  cnpj = cnpj.replace(/[^\d]+/g, '');

  if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;

  const validateIndex = (length: number) => {
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += +cnpj.charAt(length - i) * pos--;
      if (pos < 2) pos = 9;
    }

    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };

  const digit0 = validateIndex(12);
  const digit1 = validateIndex(13);

  return digit0 === +cnpj.charAt(12) && digit1 === +cnpj.charAt(13);
};
