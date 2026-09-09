"use client";

import React, { useEffect, useState } from "react";
import { fetchProjects } from "@/lib/api";
import ProjectsList from "@/components/projects/ProjectsList";
import CreateProjectForm from "@/components/upload/CreateProjectForm";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);

  useEffect(() => {
    fetchProjects()
      .then((projects) => {
        setHasProjects(projects.length > 0);
      })
      .catch(() => {
        setHasProjects(false);
      });
  }, []);

  if (hasProjects === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
      </div>
    );
  }

  // If projects exist, show My Projects; otherwise directly show New Project screen
  return hasProjects ? (
    <ProjectsList onEmpty={() => setHasProjects(false)} />
  ) : (
    <CreateProjectForm />
  );
}
