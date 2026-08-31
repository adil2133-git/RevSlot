import type { BookingPageInfo } from "../type";
import { getInitials } from "../utils";

type ReviewerInfoPanelProps = {
  pageInfo: BookingPageInfo;
};

function ExternalLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-primary transition hover:underline"
    >
      {label}
    </a>
  );
}

export default function ReviewerInfoPanel({
  pageInfo,
}: ReviewerInfoPanelProps) {
  const reviewer = pageInfo.reviewer;
  const initials = getInitials(reviewer.name);

  const hasSkills = reviewer.skills && reviewer.skills.length > 0;

  return (
    <aside className="border-b border-slate-200 p-8 md:border-b-0">
      {/* Profile */}
      <div>
        {reviewer.avatarUrl ? (
          <img
            src={reviewer.avatarUrl}
            alt={reviewer.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-on-primary">
            {initials}
          </div>
        )}

        <div className="mt-4">
          <p className="text-base font-semibold text-on-surface">
            {reviewer.name}
          </p>

          {reviewer.professionalHeadline && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {reviewer.professionalHeadline}
            </p>
          )}
        </div>
      </div>

      {/* Session */}
      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Session
        </p>

        <h1 className="mt-1 text-lg font-semibold leading-snug text-on-surface">
          {pageInfo.eventType.name}
        </h1>

        {pageInfo.eventType.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {pageInfo.eventType.description}
          </p>
        )}
      </div>

      {/* Professional Summary */}
      {(reviewer.bio ||
        reviewer.yearsOfExperience ||
        reviewer.currentRole ||
        reviewer.currentCompany) && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold text-on-surface">
            About the reviewer
          </h2>

          {reviewer.bio && (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {reviewer.bio}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {reviewer.yearsOfExperience !== null &&
              reviewer.yearsOfExperience !== undefined && (
                <div>
                  <p className="text-xs text-slate-400">Experience</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    {reviewer.yearsOfExperience}+ years
                  </p>
                </div>
              )}

            {reviewer.currentRole && (
              <div>
                <p className="text-xs text-slate-400">Current role</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {reviewer.currentRole}
                </p>
              </div>
            )}

            {reviewer.currentCompany && (
              <div>
                <p className="text-xs text-slate-400">Company</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {reviewer.currentCompany}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {hasSkills && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold text-on-surface">
            Expertise
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {reviewer.skills!.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {(reviewer.degree ||
        reviewer.university ||
        reviewer.graduationYear) && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold text-on-surface">
            Education
          </h2>

          <div className="mt-3">
            {reviewer.degree && (
              <p className="text-sm font-medium text-slate-700">
                {reviewer.degree}
              </p>
            )}

            {reviewer.university && (
              <p className="mt-1 text-sm text-slate-500">
                {reviewer.university}
              </p>
            )}

            {reviewer.graduationYear && (
              <p className="mt-1 text-xs text-slate-400">
                Graduated {reviewer.graduationYear}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Public Links */}
      {(reviewer.linkedinUrl ||
        reviewer.githubUrl ||
        reviewer.portfolioUrl) && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="text-sm font-semibold text-on-surface">
            Professional links
          </h2>

          <div className="mt-3 flex flex-col gap-2">
            {reviewer.linkedinUrl && (
              <ExternalLink
                href={reviewer.linkedinUrl}
                label="LinkedIn"
              />
            )}

            {reviewer.githubUrl && (
              <ExternalLink
                href={reviewer.githubUrl}
                label="GitHub"
              />
            )}

            {reviewer.portfolioUrl && (
              <ExternalLink
                href={reviewer.portfolioUrl}
                label="Portfolio"
              />
            )}
          </div>
        </div>
      )}

      {/* Session Details */}
      <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          {pageInfo.eventType.durationMinutes} min
        </div>

        <div className="flex items-center gap-2.5 text-sm text-slate-600">
         <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9 4.5 4.03 4.5 9-2.015 9-4.5 9zM3.5 12h17"
            />
          </svg>

          {pageInfo.eventType.timezone}
        </div>
      </div>
    </aside>
  );
}