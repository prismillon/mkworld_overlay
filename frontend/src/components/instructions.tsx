const ENGLISH_STEPS = [
  'Enter your player name above and click "Get MMR"',
  'Click "Copy Overlay URL" button',
  "In OBS, add a Browser Source",
  "Paste the URL in the URL field",
  'Check "Shutdown source when not visible"',
  'Check "Refresh browser when scene becomes active"',
];

const JAPANESE_STEPS = [
  "上にプレイヤー名を入力して「Get MMR」をクリック",
  "「Copy Overlay URL」ボタンをクリック",
  "OBSでブラウザソースを追加",
  "完全なURLをURLフィールドにペースト",
  "「表示されていない時にソースをシャットダウン」をチェック",
  "「シーンがアクティブになった時にブラウザを更新」をチェック",
];

interface InstructionCardProps {
  title: string;
  steps: readonly string[];
}

function InstructionCard({ title, steps }: InstructionCardProps) {
  return (
    <div className="instruction-card">
      <div className="instruction-card__header">
        <h4>{title}</h4>
      </div>
      <ol>
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

export function Instructions() {
  return (
    <section className="instructions">
      <div className="instructions__content">
        <h2 className="instructions__title">Setup Instructions</h2>

        <div className="instructions__section">
          <h3>English Instructions</h3>
          <div className="instructions__cards">
            <InstructionCard
              title="How to use this overlay in OBS:"
              steps={ENGLISH_STEPS}
            />
          </div>
        </div>

        <div className="instructions__section">
          <h3>日本語の説明</h3>
          <div className="instructions__cards">
            <InstructionCard
              title="OBSでこのオーバーレイを使用する方法："
              steps={JAPANESE_STEPS}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
