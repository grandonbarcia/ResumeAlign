type ExportResumePreviewProps = {
  label?: string;
  title: string;
  text: string;
};

function isHeading(line: string) {
  return /^[A-Z][A-Z\s]{2,}$/.test(line.trim());
}

function isBullet(line: string) {
  return line.trim().startsWith('- ');
}

function getLines(text: string) {
  return text.replace(/\r\n/g, '\n').split('\n');
}

export function ExportResumePreview({
  label,
  title,
  text,
}: ExportResumePreviewProps) {
  const lines = getLines(text);
  const pageLabel = label ?? 'PDF preview';
  const pageHint = 'Letter page, ATS-friendly plain layout';

  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900">{pageLabel}</h3>
        <div className="text-xs text-slate-500">{pageHint}</div>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4">
        <div className="mx-auto min-h-240 w-full max-w-190 rounded-sm border border-slate-200 bg-white px-6 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">
          <div className="font-sans text-[11px] leading-[1.35rem] text-slate-900">
            <div className="mb-5 text-[14px] font-bold">{title}</div>

            <div className="space-y-1">
              {lines.length ? (
                lines.map((line, index) => {
                  const trimmed = line.trim();

                  if (!trimmed) {
                    return <div key={`blank-${index}`} className="h-3" />;
                  }

                  if (isHeading(trimmed)) {
                    return (
                      <div
                        key={`heading-${index}-${trimmed}`}
                        className="mt-4 border-b border-slate-300 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase"
                      >
                        {trimmed}
                      </div>
                    );
                  }

                  if (isBullet(trimmed)) {
                    return (
                      <div
                        key={`bullet-${index}-${trimmed}`}
                        className="flex items-start gap-2 pl-4"
                      >
                        <span className="pt-px text-slate-500">•</span>
                        <span>{trimmed.slice(2)}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`line-${index}-${trimmed}`}
                      className="whitespace-pre-wrap"
                    >
                      {trimmed}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500">
                  No exported resume text found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
