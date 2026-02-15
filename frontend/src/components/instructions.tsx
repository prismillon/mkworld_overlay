import { useTranslation } from "react-i18next";

export function Instructions() {
  const { t } = useTranslation();
  const steps = t("instructions.steps", { returnObjects: true }) as string[];

  return (
    <section className="instructions">
      <div className="instructions__content">
        <h2 className="instructions__title">{t("instructions.title")}</h2>

        <div className="instructions__section">
          <div className="instructions__cards">
            <div className="instruction-card">
              <div className="instruction-card__header">
                <h4>{t("instructions.cardTitle")}</h4>
              </div>
              <ol>
                {steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
