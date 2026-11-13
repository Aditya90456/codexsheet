import { setUiLanguage, uiLanguages, useT, useUiLanguage } from "./i18n";

export default function LanguagePicker({ placement }: { placement: "sidebar" | "footer" }) {
  const lang = useUiLanguage();
  const tr = useT();

  return (
    <label className={`language-picker language-picker-${placement}`}>
      <span>{tr("lang.label")}</span>
      <select
        aria-label={tr("lang.label")}
        value={lang}
        onChange={(event) => setUiLanguage(event.target.value as (typeof uiLanguages)[number]["id"])}
      >
        {uiLanguages.map((option) => (
          <option key={option.id} value={option.id}>
            {option.native} · {option.english}
          </option>
        ))}
      </select>
      <small>Full interface translations are not available yet.</small>
    </label>
  );
}
