type Props = {
  className?: string;
};

function isMockMode() {
  const mode = (
    process.env.AI_MODE ||
    process.env.AI_PROVIDER ||
    ''
  ).toLowerCase();
  return mode === 'mock' || !process.env.OPENAI_API_KEY;
}

export function MockModeBanner(props: Props) {
  if (!isMockMode()) return null;

  return (
    <div
      className={
        'rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 ' +
        (props.className ?? '')
      }
      role="status"
      aria-live="polite"
    >
      <div className="font-medium">Mock mode enabled</div>
      <div className="mt-1">
        No OpenAI key detected (or{' '}
        <span className="font-mono">AI_MODE=mock</span>
        ). Structured outputs and rewrites are generated with lightweight
        heuristics until you configure an AI provider.
      </div>
    </div>
  );
}
