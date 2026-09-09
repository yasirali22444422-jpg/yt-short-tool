from app.schemas.analysis import (
    CharacterBibleItem,
    EditingDNA,
    GlobalStyleDNA,
    LocationRegistryItem,
    ObjectRegistryItem,
    SceneAnalysisData,
)


def compile_image_prompt(
    scene: SceneAnalysisData,
    style: GlobalStyleDNA,
    characters: list[CharacterBibleItem],
    locations: list[LocationRegistryItem],
) -> str:
    """
    Compiles an ultra-detailed, production-ready keyframe image prompt.
    """
    char_map = {c.id: c for c in characters}
    loc_map = {l.id: l for l in locations}

    # Character description clauses
    char_clauses: list[str] = []
    for cid in scene.characters:
        if cid in char_map:
            c = char_map[cid]
            clothes = ", ".join(c.clothing) if c.clothing else "standard attire"
            char_clauses.append(
                f"{c.display_name} ({c.type}, {c.gender_presentation}, {c.height_build}, {c.hair}, {c.skin_tone} skin, wearing {clothes})"
            )
        else:
            char_clauses.append(cid)

    chars_str = " and ".join(char_clauses) if char_clauses else "No main characters"

    loc = loc_map.get(scene.location_id)
    loc_str = f"{loc.name} ({loc.environment}, {loc.time_of_day}, {loc.lighting})" if loc else "cinematic setting"

    actions_str = ", ".join(scene.character_actions) if scene.character_actions else scene.scene_summary or "posing dynamically"
    expressions_str = f", facial expression: {', '.join(scene.facial_expressions)}" if scene.facial_expressions else ""

    prompt = (
        f"{scene.camera_shot} shot of {chars_str} in {loc_str}. "
        f"Action: {actions_str}{expressions_str}. "
        f"Composition: {scene.composition}, camera angle: {scene.camera_angle}, estimated lens feel: {scene.lens_feel}. "
        f"Lighting: {scene.lighting}, color palette: {scene.color_palette}. "
        f"Atmosphere: {style.overall_mood}, medium: {style.medium}, visual style: {style.visual_style}. "
        f"Depth of field: {style.depth_of_field}, textures: {style.texture_style}, 8k resolution, cinematic masterpiece."
    )
    return prompt.strip()


def compile_animation_prompt(scene: SceneAnalysisData, style: GlobalStyleDNA) -> str:
    """
    Compiles an Image-to-Video (I2V) animation prompt focusing strictly on motion dynamics,
    camera trajectories, speed, and physics.
    """
    cam_motion = scene.camera_movement if scene.camera_movement else "Steady camera with subtle organic movement"
    sub_motion = scene.subject_motion if scene.subject_motion else "Characters execute natural gestures and movement"
    env_motion = scene.environment_motion if scene.environment_motion else "ambient environmental movement"
    physics = scene.physics if scene.physics else "realistic fluid physics"

    prompt = (
        f"Camera trajectory: {cam_motion}, {scene.camera_angle} angle. "
        f"Subject dynamics: {sub_motion}. Secondary physics: {physics}, cloth and hair motion. "
        f"Environmental interaction: {env_motion}. Motion cadence: {style.motion_style}, consistent timing across {scene.duration:.1f} seconds. "
        f"Smooth cinematic interpolation, seamless temporal stability."
    )
    return prompt.strip()


def compile_text_to_video_prompt(
    scene: SceneAnalysisData,
    style: GlobalStyleDNA,
    characters: list[CharacterBibleItem],
    locations: list[LocationRegistryItem],
) -> str:
    """
    Compiles a comprehensive Text-to-Video (T2V) prompt uniting appearance, motion, camera, and narrative.
    """
    image_base = compile_image_prompt(scene, style, characters, locations)
    motion_base = compile_animation_prompt(scene, style)

    prompt = (
        f"{image_base} [MOTION & CAMERA DYNAMICS]: {motion_base} "
        f"[TIMING]: Duration {scene.duration:.1f}s, editing transition: {scene.transition_in} to {scene.transition_out}."
    )
    return prompt.strip()


def compile_negative_prompt() -> str:
    """
    Standard negative prompt preventing common visual deformities and AI video artifacts.
    """
    return (
        "blurry, low resolution, warped hands, extra limbs, missing fingers, deformed anatomy, "
        "jittery motion, erratic camera jumps, abrupt flicker, morphing artifacts, duplicate characters, "
        "watermark, text overlay, oversaturated, unnatural plastic skin"
    )


def generate_master_blueprint_markdown(
    project_name: str,
    content_type: str,
    style: GlobalStyleDNA,
    editing: EditingDNA,
    characters: list[CharacterBibleItem],
    objects: list[ObjectRegistryItem],
    locations: list[LocationRegistryItem],
    scenes: list[SceneAnalysisData],
) -> str:
    """
    Compiles the comprehensive Master Recreation Blueprint markdown document.
    """
    lines: list[str] = [
        f"# Master Recreation Blueprint: {project_name}",
        f"**Content Type:** {content_type} | **Style:** {style.visual_style} ({style.medium})",
        "",
        "---",
        "",
        "## 1. Global Style DNA",
        f"- **Medium:** {style.medium}",
        f"- **Visual Style:** {style.visual_style}",
        f"- **Color Palette:** {style.color_palette}",
        f"- **Lighting Style:** {style.lighting_style}",
        f"- **Texture Style:** {style.texture_style}",
        f"- **Camera Language:** {style.camera_language}",
        f"- **Motion Style:** {style.motion_style}",
        f"- **Editing Pace:** {style.editing_pace} (Average shot length: ~{editing.average_shot_length:.1f}s)",
        f"- **Overall Mood:** {style.overall_mood}",
        "",
        "---",
        "",
        "## 2. Character Bibles & Continuity Registry",
    ]

    if characters:
        for c in characters:
            lines.extend([
                f"### `{c.id}` - {c.display_name}",
                f"- **Type:** {c.type} | **Gender/Age:** {c.gender_presentation}, ~{c.estimated_age}",
                f"- **Appearance:** {c.height_build}, {c.skin_tone} skin tone, {c.hair}, {c.eyes} eyes",
                f"- **Clothing:** {', '.join(c.clothing) if c.clothing else 'Standard'}",
                f"- **Visual Style & Continuity:** {c.visual_style}",
                "",
            ])
    else:
        lines.append("*No recurring main characters detected.*\n")

    lines.extend([
        "---",
        "",
        "## 3. Recurring Objects & Props",
    ])
    if objects:
        for o in objects:
            lines.append(f"- **`{o.id}` ({o.name}):** {o.appearance} ({o.color}, {o.material})")
    else:
        lines.append("*No recurring focal objects registered.*")

    lines.extend([
        "",
        "---",
        "",
        "## 4. Location Registry",
    ])
    if locations:
        for l in locations:
            lines.append(f"- **`{l.id}` ({l.name}):** {l.environment}, {l.time_of_day}, lighting: {l.lighting}, palette: {l.color_palette}")
    else:
        lines.append("*Single continuous setting.*")

    lines.extend([
        "",
        "---",
        "",
        "## 5. Scene-by-Scene Recreation Prompts",
    ])

    for s in scenes:
        lines.extend([
            f"### Scene {s.scene_number:02d} ({s.start_time:.2f}s → {s.end_time:.2f}s | {s.duration:.1f}s)",
            f"**Summary:** {s.scene_summary or 'Dynamic shot sequence'}",
            f"- **Shot Type:** {s.camera_shot} | **Angle:** {s.camera_angle} | **Lens Feel:** {s.lens_feel}",
            f"- **Camera Movement:** {s.camera_movement}",
            f"- **Lighting & Palette:** {s.lighting} | {s.color_palette}",
            "",
            "#### Image Generation Prompt (Keyframe):",
            f"```text\n{s.image_prompt}\n```",
            "",
            "#### Image-to-Video Animation Prompt (I2V):",
            f"```text\n{s.animation_prompt}\n```",
            "",
            "#### Text-to-Video Prompt (T2V):",
            f"```text\n{s.text_to_video_prompt}\n```",
            "",
            "#### Negative Prompt:",
            f"```text\n{s.negative_prompt}\n```",
            "",
        ])

    lines.extend([
        "---",
        "",
        "## 6. Global Continuity & Execution Rules",
        "1. **Character Consistency:** Maintain character seed, clothing tokens, and face descriptions across all scenes.",
        "2. **Color Cohesion:** Keep color grading consistent with the designated palette across every scene render.",
        "3. **Camera Cadence:** Preserve transition directions and shot pacing when assembling final edits.",
        "",
        "## 7. Master Production Style Prompt",
        f"```text\n{style.visual_style}, {style.medium}, {style.color_palette}, {style.lighting_style}, {style.camera_language}, cinematic 8k quality\n```",
    ])

    return "\n".join(lines)


def generate_remix_blueprint(
    original_scenes: list[SceneAnalysisData],
    original_style: GlobalStyleDNA,
    characters: list[CharacterBibleItem],
    locations: list[LocationRegistryItem],
) -> tuple[dict, str]:
    """
    Generates a creative remix transformation while preserving high-level rhythm,
    shot sizes, camera movements, and emotional beats.
    """
    remix_concept = "Neo-Cyberpunk Sci-Fi Reimagining"
    target_genre = "Cyberpunk / High-Tech Sci-Fi"

    char_map: dict[str, str] = {}
    for c in characters:
        char_map[c.id] = f"Cyber-augmented {c.display_name} with holographic neon gear and cyberware"

    loc_map: dict[str, str] = {}
    for l in locations:
        loc_map[l.id] = f"Neo-Tokyo rainy cyber-district ({l.name}) with towering holographic billboards and neon reflections"

    remixed_scenes: list[dict] = []
    markdown_lines = [
        f"# Creative Remix Blueprint: {remix_concept}",
        f"**Target Genre:** {target_genre}",
        f"**Premise:** Re-engineers the reference video's cinematography, camera movements, and timing into a futuristic cyberpunk narrative.",
        "",
        "---",
        "",
        "## Character Transpositions",
    ]

    for orig_id, remixed_desc in char_map.items():
        markdown_lines.append(f"- **{orig_id} Transformed:** {remixed_desc}")

    markdown_lines.extend(["", "---", "", "## Remixed Scene Breakdown"])

    for s in original_scenes:
        remix_summary = f"Cyberpunk reimagining of Scene {s.scene_number:02d}: Holographic neon atmosphere with high-tech props."
        remix_image_prompt = (
            f"{s.camera_shot} shot in a neon-lit cyberpunk metropolis. "
            f"Subject: {', '.join([char_map.get(cid, cid) for cid in s.characters]) or 'Cybernetic operative'}. "
            f"Camera: {s.camera_angle}, {s.lens_feel}, volumetric fog and iridescent neon reflections. "
            f"Cyberpunk aesthetic, unreal engine 5 render, cinematic lighting."
        )
        remix_t2v = (
            f"{remix_image_prompt} [MOTION]: Camera executes {s.camera_movement}. "
            f"Flickering neon lights, rain particle physics, duration {s.duration:.1f}s."
        )

        remixed_scenes.append({
            "scene_number": s.scene_number,
            "original_scene_id": s.scene_id,
            "remix_summary": remix_summary,
            "remixed_image_prompt": remix_image_prompt,
            "remixed_t2v_prompt": remix_t2v,
            "duration": s.duration,
        })

        markdown_lines.extend([
            f"### Remixed Scene {s.scene_number:02d} ({s.duration:.1f}s)",
            f"**Summary:** {remix_summary}",
            f"- **Camera Movement:** {s.camera_movement} ({s.camera_angle})",
            "",
            "#### Remixed Image Prompt:",
            f"```text\n{remix_image_prompt}\n```",
            "",
            "#### Remixed Video Prompt:",
            f"```text\n{remix_t2v}\n```",
            "",
        ])

    remix_data = {
        "remix_concept": remix_concept,
        "target_genre": target_genre,
        "character_mappings": char_map,
        "location_mappings": loc_map,
        "remixed_scenes": remixed_scenes,
        "remixed_blueprint_markdown": "\n".join(markdown_lines),
    }

    return remix_data, "\n".join(markdown_lines)
