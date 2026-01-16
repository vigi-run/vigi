import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLocalizedTranslation } from "@/hooks/useTranslation";

const allLanguages = [
    { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
    { code: "en-US", name: "English", flag: "🇺🇸" },
];

export function LanguageSelector() {
    const { getCurrentLanguage, changeLanguage } = useLocalizedTranslation();
    const currentLanguage = getCurrentLanguage();

    const currentLang =
        allLanguages.find((lang) => lang.code === currentLanguage) || allLanguages[0];

    return (
        <Select value={currentLanguage} onValueChange={changeLanguage}>
            <SelectTrigger className="w-full">
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <span>{currentLang.flag}</span>
                        <span className="">{currentLang.name}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>

            <SelectContent>
                {allLanguages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
