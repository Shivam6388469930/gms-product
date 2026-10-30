import ProjectSetupStepper from "@/components/SurveyCreationStepper";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <ProjectSetupStepper />

      {children}
    </div>
  );
}