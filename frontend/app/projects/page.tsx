"use client";

import React, { useState } from "react";
import ProjectsList from "@/components/projects/ProjectsList";
import CreateProjectForm from "@/components/upload/CreateProjectForm";

export default function ProjectsPage() {
  const [isEmpty, setIsEmpty] = useState(false);

  if (isEmpty) {
    return <CreateProjectForm />;
  }

  return <ProjectsList onEmpty={() => setIsEmpty(true)} />;
}
