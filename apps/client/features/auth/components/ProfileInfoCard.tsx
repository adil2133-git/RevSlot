"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Save,
  UserRound,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const labelClassName =
  "mb-2 block text-sm font-medium text-slate-700";

const sectionClassName =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

export default function ProfileInfoCard() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [professionalHeadline, setProfessionalHeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");

  const [degree, setDegree] = useState("");
  const [university, setUniversity] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name ?? "");
    setBio(user.bio ?? "");
    setWhatsappNumber(user.whatsappNumber ?? "");

    setProfessionalHeadline(user.professionalHeadline ?? "");
    setSkills(user.skills?.join(", ") ?? "");
    setYearsOfExperience(
      user.yearsOfExperience !== null &&
        user.yearsOfExperience !== undefined
        ? String(user.yearsOfExperience)
        : ""
    );
    setCurrentRole(user.currentRole ?? "");
    setCurrentCompany(user.currentCompany ?? "");

    setDegree(user.degree ?? "");
    setUniversity(user.university ?? "");
    setGraduationYear(
      user.graduationYear !== null &&
        user.graduationYear !== undefined
        ? String(user.graduationYear)
        : ""
    );

    setLinkedinUrl(user.linkedinUrl ?? "");
    setGithubUrl(user.githubUrl ?? "");
    setPortfolioUrl(user.portfolioUrl ?? "");
  }, [user]);

  const dirty = useMemo(() => {
    if (!user) return false;

    return (
      name.trim() !== (user.name ?? "") ||
      bio.trim() !== (user.bio ?? "") ||
      whatsappNumber.trim() !== (user.whatsappNumber ?? "") ||
      professionalHeadline.trim() !==
        (user.professionalHeadline ?? "") ||
      skills.trim() !== (user.skills ?? "") ||
      yearsOfExperience !==
        (user.yearsOfExperience !== null &&
        user.yearsOfExperience !== undefined
          ? String(user.yearsOfExperience)
          : "") ||
      currentRole.trim() !== (user.currentRole ?? "") ||
      currentCompany.trim() !== (user.currentCompany ?? "") ||
      degree.trim() !== (user.degree ?? "") ||
      university.trim() !== (user.university ?? "") ||
      graduationYear !==
        (user.graduationYear !== null &&
        user.graduationYear !== undefined
          ? String(user.graduationYear)
          : "") ||
      linkedinUrl.trim() !== (user.linkedinUrl ?? "") ||
      githubUrl.trim() !== (user.githubUrl ?? "") ||
      portfolioUrl.trim() !== (user.portfolioUrl ?? "")
    );
  }, [
    user,
    name,
    bio,
    whatsappNumber,
    professionalHeadline,
    skills,
    yearsOfExperience,
    currentRole,
    currentCompany,
    degree,
    university,
    graduationYear,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
  ]);

  const handleSave = async () => {
    if (!user || !dirty) return;

    setSaved(false);

    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,

        professionalHeadline:
          professionalHeadline.trim() || undefined,
        skills: skills
               .split(",")
               .map((skill) => skill.trim())
               .filter(Boolean),
        yearsOfExperience:
          yearsOfExperience.trim() === ""
            ? undefined
            : Number(yearsOfExperience),
        currentRole: currentRole.trim() || undefined,
        currentCompany: currentCompany.trim() || undefined,
        degree: degree.trim() || undefined,
        university: university.trim() || undefined,
        graduationYear:
          graduationYear.trim() === ""
            ? undefined
            : Number(graduationYear),

        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch {
      setSaved(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className={sectionClassName}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <UserRound className="h-5 w-5 text-slate-700" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Public Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Help clients understand your professional background
              before booking a review session.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClassName}>
              Full name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={inputClassName}
              placeholder="Your full name"
              maxLength={50}
            />
          </div>

          <div>
            <label className={labelClassName}>
              Professional headline
            </label>

            <input
              value={professionalHeadline}
              onChange={(event) =>
                setProfessionalHeadline(event.target.value)
              }
              className={inputClassName}
              placeholder="Senior Full-Stack Developer & Code Reviewer"
              maxLength={120}
            />

            <p className="mt-1.5 text-xs text-slate-400">
              A short professional title clients can understand
              immediately.
            </p>
          </div>

          <div>
            <label className={labelClassName}>
              About you
            </label>

            <textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
              className={`${inputClassName} min-h-28 resize-y`}
              placeholder="Briefly describe your professional background and the kind of reviews you provide."
              maxLength={300}
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {bio.length}/300
            </div>
          </div>

          <div>
            <label className={labelClassName}>
              WhatsApp number
            </label>

            <input
              value={whatsappNumber}
              onChange={(event) =>
                setWhatsappNumber(event.target.value)
              }
              className={inputClassName}
              placeholder="+919876543210"
              inputMode="tel"
            />

            <p className="mt-1.5 text-xs text-slate-400">
              Private contact information. This will not be shown
              on your public booking page.
            </p>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Briefcase className="h-5 w-5 text-slate-700" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Professional Experience
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Show clients the experience and technology background
              you bring to a review.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClassName}>
              Years of experience
            </label>

            <input
              type="number"
              min={0}
              max={50}
              value={yearsOfExperience}
              onChange={(event) =>
                setYearsOfExperience(event.target.value)
              }
              className={inputClassName}
              placeholder="5"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                Current role
              </label>

              <input
                value={currentRole}
                onChange={(event) =>
                  setCurrentRole(event.target.value)
                }
                className={inputClassName}
                placeholder="Senior Software Engineer"
                maxLength={100}
              />
            </div>

            <div>
              <label className={labelClassName}>
                Current company
              </label>

              <input
                value={currentCompany}
                onChange={(event) =>
                  setCurrentCompany(event.target.value)
                }
                className={inputClassName}
                placeholder="Company name"
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>
              Skills & technologies
            </label>

            <input
              value={skills}
              onChange={(event) =>
                setSkills(event.target.value)
              }
              className={inputClassName}
              placeholder="React, Next.js, Node.js, TypeScript, PostgreSQL, AWS"
              maxLength={500}
            />

            <p className="mt-1.5 text-xs text-slate-400">
              Separate technologies with commas.
            </p>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <GraduationCap className="h-5 w-5 text-slate-700" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Education
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add your primary educational qualification.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClassName}>
              Degree
            </label>

            <input
              value={degree}
              onChange={(event) =>
                setDegree(event.target.value)
              }
              className={inputClassName}
              placeholder="B.E. Computer Science"
              maxLength={120}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>
                University / Institution
              </label>

              <input
                value={university}
                onChange={(event) =>
                  setUniversity(event.target.value)
                }
                className={inputClassName}
                placeholder="University name"
                maxLength={150}
              />
            </div>

            <div>
              <label className={labelClassName}>
                Graduation year
              </label>

              <input
                type="number"
                min={1950}
                max={2100}
                value={graduationYear}
                onChange={(event) =>
                  setGraduationYear(event.target.value)
                }
                className={inputClassName}
                placeholder="2022"
              />
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <LinkIcon className="h-5 w-5 text-slate-700" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Professional Links
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Optional links clients can use to learn more about
              your professional background.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClassName}>
              LinkedIn
            </label>

            <input
              type="url"
              value={linkedinUrl}
              onChange={(event) =>
                setLinkedinUrl(event.target.value)
              }
              className={inputClassName}
              placeholder="https://www.linkedin.com/in/your-profile"
            />
          </div>

          <div>
            <label className={labelClassName}>
              GitHub
            </label>

            <input
              type="url"
              value={githubUrl}
              onChange={(event) =>
                setGithubUrl(event.target.value)
              }
              className={inputClassName}
              placeholder="https://github.com/your-username"
            />
          </div>

          <div>
            <label className={labelClassName}>
              Portfolio
            </label>

            <input
              type="url"
              value={portfolioUrl}
              onChange={(event) =>
                setPortfolioUrl(event.target.value)
              }
              className={inputClassName}
              placeholder="https://yourportfolio.com"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm font-medium text-emerald-600">
            Changes saved
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />

          {isLoading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}