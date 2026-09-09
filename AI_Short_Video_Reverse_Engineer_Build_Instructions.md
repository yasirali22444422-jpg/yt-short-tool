# AI Short Video Reverse Engineering Tool
## Complete Product Requirements + Technical Build Instructions

> **Purpose of this file:**  
> Give this entire file to an AI coding assistant (Cursor, Claude Code, ChatGPT/Codex, Gemini CLI, etc.) and ask it to build the application step-by-step.  
> The AI must follow the architecture, scope, rules, data structures, UX, security, and development phases defined here.

---

# 1. PROJECT NAME

**Working Name:** AI Short Video Reverse Engineer

Alternative names:
- Video Recreation Blueprint
- Short2Prompt AI
- Reference Video Analyzer
- AI Video Prompt Extractor
- Video DNA Analyzer

The final name can be changed later.

---

# 2. CORE PRODUCT IDEA

Build a web application where a user uploads a **short video** and the application automatically analyzes the video in detail.

The purpose is NOT simply to summarize the video.

The tool must convert the reference video into a **complete production/recreation blueprint** containing:

- Scene-by-scene breakdown
- Character descriptions
- Character consistency data
- Object descriptions
- Location descriptions
- Art/visual style
- Camera shots
- Camera angles
- Camera movement
- Approximate lens style
- Lighting
- Composition
- Actions
- Motion
- Physics
- VFX
- Editing style
- Transitions
- Dialogue
- Audio cues
- Sound effects
- Image generation prompts
- Image-to-video animation prompts
- Text-to-video prompts
- Master style prompt
- Master character prompt
- Master recreation blueprint

The application should work with:

- AI-generated videos
- Real camera footage
- 2D animation
- 3D animation
- Cartoon content
- Anime
- Cinematic videos
- Shorts
- Reels
- TikTok-style videos
- Faceless videos
- Mixed-media videos

---

# 3. V1 PRODUCT SCOPE

## Supported Video Duration

V1 should support:

**1 second to 90 seconds**

Primary use case:

**5–60 second short-form content**

Long-form videos, documentaries, movies, and full episodes are NOT part of V1.

---

# 4. IMPORTANT PRODUCT PHILOSOPHY

The tool must NOT behave like a simple:

> "Upload video → write one paragraph prompt"

Instead, the architecture must be:

```text
Video Upload
    ↓
Technical Metadata Extraction
    ↓
Scene / Shot Detection
    ↓
Smart Keyframe Extraction
    ↓
Duplicate Frame Removal
    ↓
Audio Extraction
    ↓
Transcript / Audio Analysis
    ↓
Multimodal AI Analysis
    ↓
Global Style DNA
    ↓
Character / Object / Location Registry
    ↓
Scene-by-Scene Analysis
    ↓
Motion + Camera + VFX Analysis
    ↓
Editing / Transition Analysis
    ↓
Structured JSON Output
    ↓
Prompt Compiler
    ↓
Image Prompt
Animation Prompt
Text-to-Video Prompt
Master Recreation Blueprint
```

---

# 5. MAIN USER FLOW

The normal user flow must remain extremely simple.

## Step 1
User opens dashboard.

## Step 2
User uploads a short video.

Supported formats initially:

- MP4
- MOV
- WebM

## Step 3
User selects analysis mode:

- Fast
- Detailed
- Deep

## Step 4
User selects AI provider:

- Default
- Gemini
- OpenAI
- Claude
- Other providers added later

## Step 5
User presses:

**Analyze Video**

## Step 6
Application processes the video and shows progress.

Example:

```text
Uploading video...
Reading metadata...
Detecting scenes...
Extracting important frames...
Analyzing audio...
Identifying characters...
Analyzing camera motion...
Generating prompts...
Preparing final blueprint...
```

## Step 7
User sees results.

---

# 6. MAIN DASHBOARD

Keep the dashboard beginner-friendly.

Dashboard sections:

1. **New Analysis**
2. **My Projects**
3. **AI Providers**
4. **Settings**

Do not overload the interface.

---

# 7. VIDEO UPLOAD SCREEN

The upload card should show:

- Drag & drop area
- Browse file
- Maximum duration: 90 seconds
- Supported file types
- Maximum file size configuration
- Thumbnail after upload
- Duration
- Resolution
- Aspect ratio

After upload show:

```text
Video: example.mp4
Duration: 00:42
Resolution: 1080 × 1920
FPS: 30
Aspect Ratio: 9:16
```

These technical values must come from actual file metadata, not AI guesses.

Use:

**FFprobe / FFmpeg**

---

# 8. ANALYSIS MODES

## FAST MODE

Purpose:
- Cheapest
- Fastest
- Basic useful output

Analyze:

- Basic scene detection
- 1–2 representative frames per scene
- Main characters
- Main location
- Basic visual style
- Basic camera information
- Image prompt
- Animation prompt
- Text-to-video prompt

---

## DETAILED MODE

Recommended default.

Analyze:

- 3–5 useful keyframes per scene
- Character consistency
- Object consistency
- Locations
- Lighting
- Camera movement
- Subject movement
- Transitions
- VFX
- Dialogue
- Sound effects
- Editing
- Prompt generation
- Continuity

---

## DEEP MODE

Maximum useful analysis.

Include:

- Adaptive number of frames
- Micro-actions
- Character posture changes
- Facial expressions
- Foreground/background layers
- Lighting direction
- Detailed camera behavior
- Estimated lens feel
- Cloth / hair movement
- Environmental physics
- Motion blur
- Particle effects
- Audio synchronization
- Precise editing events
- Strong continuity analysis

---

# 9. TECH STACK

Recommended stack for V1.

## Frontend

Use:

**Next.js + React + TypeScript**

Recommended:

- Next.js App Router
- Tailwind CSS
- shadcn/ui or a similar clean component system

The application should be responsive.

Desktop is the priority for V1.

---

## Backend

Use:

**Python + FastAPI**

Python is preferred because:

- FFmpeg integration
- OpenCV
- PySceneDetect
- image/video processing
- Whisper
- computer vision ecosystem

are easier in Python.

---

## Database

Start with:

**SQLite**

Architecture must allow later migration to:

- PostgreSQL
- Supabase
- Neon
- another hosted DB

---

## Video Processing

Use:

- FFmpeg
- FFprobe
- PySceneDetect
- OpenCV

---

## Speech-to-Text

Preferred:

**Whisper locally**

Possible options:

- faster-whisper
- open-source Whisper implementation

Do not require a paid transcription API for V1.

---

# 10. MULTI-AI PROVIDER ARCHITECTURE

This is a critical requirement.

The app must NOT be tightly coupled to Gemini.

Create an abstraction layer.

Example:

```text
AIProvider
│
├── GeminiProvider
├── OpenAIProvider
├── ClaudeProvider
└── FutureProvider
```

Create a standard interface like:

```python
class AIProvider:
    async def analyze_scene(...)
    async def analyze_video_context(...)
    async def generate_prompts(...)
    async def test_connection(...)
```

Each provider adapter converts the application's standard request format into that provider's API format.

---

# 11. BYOK — BRING YOUR OWN API KEY

Users must be able to add their own API keys.

Add a settings tab:

## AI Providers

Each provider card should contain:

- Provider name
- API key input
- Show/hide button
- Model selection
- Test connection button
- Save button
- Delete key button

Example:

```text
Gemini
API Key: ****************
Model: [dropdown]
[ Test Connection ]
[ Save ]
```

Possible providers:

- Gemini
- OpenAI
- Claude

Do NOT hard-code current model names throughout the application.

Provider models should be configurable.

---

# 12. DEFAULT AI MODE

The owner may configure a default backend AI provider.

Users should see:

```text
AI Mode

○ Default AI
○ Use My API Key
```

This allows:

- owner-hosted limited usage
- BYOK users
- future paid hosted credits

---

# 13. API KEY SECURITY

Important.

Never store API keys as plain text.

Recommended approach:

- Encrypt keys server-side
- Use environment-based encryption secret
- Only decrypt when making API requests
- Never return full API key to frontend after save

Frontend should display:

```text
sk-••••••••••••1234
```

Allow:

- replace
- delete

Log files must NEVER contain API keys.

---

# 14. VIDEO PRIVACY

Uploaded videos may contain private content.

Create privacy-conscious processing.

Recommended default:

- Video uploaded
- Processed temporarily
- Analysis saved
- Original video automatically deleted after processing

User can optionally enable:

**Keep Original Video**

For V1, keeping original video should be OFF by default.

Store:

- technical metadata
- thumbnails/keyframes
- structured analysis
- prompts

instead of full videos when possible.

---

# 15. TECHNICAL METADATA EXTRACTION

Use FFprobe.

Extract:

```json
{
  "filename": "",
  "duration_seconds": 0,
  "width": 0,
  "height": 0,
  "aspect_ratio": "",
  "fps": 0,
  "codec": "",
  "audio_codec": "",
  "file_size": 0
}
```

These fields are:

**DETECTED FACTS**

They should NOT receive AI confidence scores.

---

# 16. CONTENT TYPE DETECTION

Automatically classify the video as one of:

- Real footage
- AI-generated / synthetic
- 2D animation
- 3D animation
- Anime
- Cartoon
- Motion graphics
- Mixed media
- Unknown

This classification may be AI-estimated.

Display:

```text
Content Type:
3D Animation

Confidence:
88%
```

---

# 17. SCENE / SHOT DETECTION

Use a hybrid method.

Primary:

**PySceneDetect**

Secondary checks:

- frame histogram difference
- structural similarity
- visual changes using OpenCV

If necessary, AI can verify ambiguous scene boundaries.

A "scene" for this application should generally mean:

**A continuous shot or visually coherent segment.**

---

# 18. EDITABLE SCENE BOUNDARIES

Automatic scene detection is never perfect.

Allow users to:

- Split scene
- Merge scene
- Delete scene
- Re-run analysis for a scene

Example:

```text
Scene 04
00:12.40 → 00:16.82

[ Split ]
[ Merge with Previous ]
[ Merge with Next ]
```

---

# 19. SMART KEYFRAME EXTRACTION

Do not send every frame to AI.

For each scene:

Extract:

- start frame
- middle frame
- end frame

Then add more frames only if significant motion occurs.

Use frame similarity detection to remove duplicates.

Goal:

Reduce unnecessary AI cost.

Example:

A 5-second 30 FPS shot contains 150 frames.

Do NOT analyze 150 frames.

Instead use approximately:

3–8 meaningful frames.

---

# 20. FRAME SIMILARITY

Use techniques such as:

- perceptual hash
- histogram comparison
- SSIM
- OpenCV image difference

Remove near-identical frames.

Store selected frame timestamps.

---

# 21. AUDIO PIPELINE

Use FFmpeg to extract audio.

Then analyze:

## Speech

Generate:

- transcript
- timestamps
- speaker estimation when practical

## Sound Effects

Detect/describe:

- footsteps
- car engine
- door sound
- explosion
- wind
- whoosh
- impact
- animal sound
- crowd sound
- other significant SFX

## Music

Describe:

- mood
- energy
- intensity
- tempo feel
- dramatic changes

Do not claim exact song identity unless explicitly supported.

---

# 22. CHARACTER SYSTEM

This is a core feature.

The AI should identify recurring characters and assign stable IDs.

Example:

```text
CHAR_001
CHAR_002
CHAR_003
```

Each character should have a Character Bible.

---

# 23. CHARACTER BIBLE STRUCTURE

Example schema:

```json
{
  "id": "CHAR_001",
  "display_name": "Main Boy",
  "type": "human",
  "gender_presentation": "male",
  "estimated_age": "10-12",
  "height_build": "short, slim",
  "skin_tone": "medium",
  "face_shape": "round",
  "hair": "short black hair",
  "eyes": "brown",
  "clothing": [
    "red oversized hoodie",
    "black trousers",
    "white sneakers"
  ],
  "accessories": [],
  "distinctive_features": [],
  "visual_style": "stylized 3D character",
  "confidence": 0.91
}
```

Important:

The system must distinguish:

**Detected / visible**

from:

**Estimated / inferred**

---

# 24. CHARACTER CONSISTENCY RULE

When the same character appears again:

Reuse the same ID.

Do not create a new character ID unless there is reasonable evidence that it is a different character.

---

# 25. CHARACTER EDITING

User can manually edit any character.

Example:

```text
Hair:
Black → Brown

Clothing:
Red Hoodie → Blue Jacket
```

Button:

**Apply Changes to All Scenes**

All relevant prompts should regenerate using the updated character data.

---

# 26. MERGE CHARACTERS

If the AI mistakenly creates:

CHAR_001

and

CHAR_004

for the same person,

allow:

**Merge Characters**

The application should then update all scene references.

---

# 27. OBJECT REGISTRY

Important recurring objects must also have IDs.

Example:

```text
OBJ_001 = Black Sports Car
OBJ_002 = Red Backpack
OBJ_003 = Sword
```

Store:

- appearance
- color
- material
- shape
- special details
- scene appearances

---

# 28. LOCATION REGISTRY

Recurring locations should have stable IDs.

Example:

```text
LOC_001 = Suburban Street
LOC_002 = Classroom
LOC_003 = Forest Clearing
```

Store:

- environment
- architecture
- weather
- time of day
- lighting
- key landmarks
- color palette

---

# 29. GLOBAL STYLE DNA

The application must generate one global Style DNA.

Schema example:

```json
{
  "medium": "3D animation",
  "visual_style": "stylized cinematic realism",
  "color_palette": "warm orange and teal",
  "lighting_style": "soft cinematic golden-hour lighting",
  "texture_style": "smooth detailed textures",
  "depth_of_field": "shallow",
  "contrast": "medium-high",
  "camera_language": "dynamic low-angle tracking shots",
  "motion_style": "smooth cinematic movement",
  "editing_pace": "fast",
  "overall_mood": "energetic and dramatic"
}
```

This data is reused across scenes.

---

# 30. SCENE ANALYSIS SCHEMA

Every scene MUST follow a fixed structured schema.

Do not allow free-form inconsistent output.

Required fields:

```json
{
  "scene_id": "SCENE_001",
  "start_time": 0.0,
  "end_time": 3.4,
  "duration": 3.4,

  "characters": [],
  "objects": [],
  "location_id": "",

  "scene_summary": "",

  "foreground": "",
  "midground": "",
  "background": "",

  "character_actions": [],
  "character_poses": [],
  "facial_expressions": [],

  "camera_shot": "",
  "camera_angle": "",
  "camera_movement": "",
  "lens_feel": "",

  "composition": "",
  "lighting": "",
  "color_palette": "",

  "subject_motion": "",
  "environment_motion": "",
  "physics": "",

  "vfx": [],
  "transition_in": "",
  "transition_out": "",

  "dialogue": [],
  "sound_effects": [],
  "music_description": "",

  "editing_notes": "",

  "image_prompt": "",
  "animation_prompt": "",
  "text_to_video_prompt": "",
  "negative_prompt": "",

  "confidence": {}
}
```

---

# 31. CAMERA ANALYSIS

Detect/estimate:

## Shot Size

- Extreme wide
- Wide
- Full
- Medium full
- Medium
- Medium close-up
- Close-up
- Extreme close-up

## Camera Angle

- Eye level
- Low angle
- High angle
- Bird's-eye
- Worm's-eye
- Over-the-shoulder
- Dutch angle
- POV

## Camera Movement

- Static
- Pan left/right
- Tilt up/down
- Dolly in/out
- Push in
- Pull out
- Tracking
- Orbit
- Crane
- Handheld
- Shake
- Drone-like
- Zoom
- Rack focus where visible

---

# 32. LENS ANALYSIS

The AI cannot always know actual lens metadata.

Therefore use language such as:

- wide-angle feel
- ~24mm visual feel
- ~35mm visual feel
- ~50mm natural perspective
- telephoto compression

Label this field:

**Estimated Lens Feel**

Never present it as verified metadata unless metadata exists.

---

# 33. LIGHTING ANALYSIS

Analyze:

- key light direction
- fill light
- backlight/rim light
- soft vs hard light
- natural vs artificial
- time of day
- warm/cool lighting
- contrast
- shadows
- volumetric lighting

---

# 34. MOTION ANALYSIS

Analyze motion separately from static appearance.

## Subject Motion

Examples:

- walking
- running
- turning
- jumping
- fighting
- talking
- falling
- flying
- hand movement
- head movement

## Environmental Motion

Examples:

- rain
- smoke
- dust
- hair movement
- cloth movement
- moving trees
- traffic
- fire
- water
- particles

---

# 35. EDITING DNA

Create a global Editing DNA.

Analyze:

- average shot duration
- cut frequency
- fast/slow pacing
- speed ramps
- jump cuts
- zoom cuts
- whip transitions
- fade
- dissolve
- flash
- match cuts
- screen shake
- motion blur
- overlays
- subtitles
- text animation

Output example:

```json
{
  "editing_pace": "fast",
  "average_shot_length": 2.1,
  "common_transitions": [
    "hard cut",
    "whip pan"
  ],
  "motion_blur": "heavy during transitions",
  "speed_ramping": true
}
```

---

# 36. TRANSITION ANALYSIS

For each transition, provide:

- timestamp
- type
- direction
- approximate duration
- intensity

Example:

```text
00:07.43

Type:
Whip Pan

Direction:
Left → Right

Duration:
~0.3 sec

Motion Blur:
Heavy
```

---

# 37. PROMPT TYPES

Every scene should generate at least four outputs.

## 1. IMAGE GENERATION PROMPT

Purpose:

Generate the key visual/frame.

Should describe:

- characters
- environment
- pose
- expression
- lighting
- composition
- camera angle
- lens feel
- visual style

---

## 2. IMAGE-TO-VIDEO ANIMATION PROMPT

Purpose:

Animate an already-created image.

Must focus on:

- subject movement
- camera movement
- facial movement
- secondary motion
- cloth/hair physics
- environmental motion
- speed
- timing
- transition

---

## 3. TEXT-TO-VIDEO PROMPT

Purpose:

Generate the entire scene directly from text.

Must combine:

- scene appearance
- character
- action
- camera
- movement
- lighting
- effects
- style
- duration

---

## 4. NEGATIVE PROMPT

When useful include:

- no duplicate characters
- no extra limbs
- no inconsistent clothing
- no unwanted objects
- no deformed hands
- no random camera jumps
- no style drift

The prompt compiler must understand that not all generators use negative prompts.

---

# 38. PROMPT TARGET SYSTEM

Do not permanently tie prompts to one model.

Create:

```text
Prompt Target
```

Options later may include:

- Generic
- Veo
- Kling
- Runway
- Hailuo
- Pika
- other generators

V1 may start with:

**Generic**

But architecture must support provider-specific formatters.

---

# 39. IMAGE PROMPT TARGETS

Future support:

- Generic
- Imagen
- Flux
- Midjourney
- ChatGPT Image
- other models

Again:

Structured scene data is the source of truth.

Prompts are generated FROM the data.

---

# 40. MASTER RECREATION BLUEPRINT

After scene analysis, generate a complete master document.

Structure:

```text
VIDEO OVERVIEW

GLOBAL STYLE DNA

CHARACTER BIBLE

OBJECT REGISTRY

LOCATION REGISTRY

CAMERA LANGUAGE

EDITING DNA

AUDIO STYLE

SCENE 01
SCENE 02
SCENE 03
...

GLOBAL CONTINUITY RULES

MASTER STYLE PROMPT

MASTER CHARACTER PROMPT

FULL RECREATION INSTRUCTIONS
```

---

# 41. RECREATE MODE

Provide a result mode:

**Recreate**

Purpose:

Analyze the reference as accurately as practical.

This means preserving:

- general visual structure
- scene timing
- technical style
- camera language
- motion
- transitions

Do not promise pixel-perfect reproduction.

---

# 42. REMIX MODE

Provide another mode:

**Remix / Make Original**

The tool can transform:

- character appearance
- clothing
- location
- props
- story details
- colors

while preserving useful high-level filmmaking structure.

Example:

```text
Original:
Boy + dog + suburban street

Remix:
Girl + robotic fox + futuristic city
```

Maintain:

- pacing
- shot structure
- camera intensity
- storytelling pattern

---

# 43. RESULTS PAGE

Recommended tabs:

1. Overview
2. Scenes
3. Characters
4. Objects
5. Locations
6. Style
7. Camera
8. Audio
9. Editing
10. Master Blueprint

---

# 44. VIDEO OVERVIEW

Show:

- thumbnail
- duration
- resolution
- FPS
- aspect ratio
- content type
- scene count
- character count
- object count
- location count
- analysis mode
- AI provider
- AI model

---

# 45. SCENE TIMELINE UI

Show visual cards.

Example:

```text
SCENE 01
00:00.00 → 00:03.42

[Start Frame] [Middle Frame] [End Frame]

Characters:
CHAR_001

Camera:
Low-angle tracking shot

Action:
Boy runs toward camera

[View Analysis]
[Image Prompt]
[Animation Prompt]
[Video Prompt]
[Regenerate]
```

---

# 46. SIDE-BY-SIDE VIEW

Create a useful detailed view.

Left:

**Reference Video Player**

Right:

**Current Scene Analysis**

When video time reaches a scene:

Automatically highlight the current scene.

Clicking a scene should seek the video player to that timestamp if the source video still exists during the session.

---

# 47. DETECTED VS ESTIMATED

UI must clearly distinguish:

## Detected

Hard facts such as:

- duration
- resolution
- FPS

## AI Estimated

Examples:

- lens feel
- age
- style
- lighting interpretation
- emotion

Use visual labels.

Example:

```text
FPS: 30
Detected

Lens Feel: ~35mm
AI Estimated — 72% confidence
```

---

# 48. CONFIDENCE SCORES

Use confidence where relevant.

Example:

```json
{
  "camera_movement": {
    "value": "tracking backward",
    "confidence": 0.92
  }
}
```

Do NOT create fake precision for fields that cannot reasonably be estimated.

Confidence may be:

- AI-provided
- model-calibrated later
- simplified as Low / Medium / High in UI

---

# 49. USER CORRECTION SYSTEM

Users must be able to edit analysis.

Editable:

- character description
- object description
- location
- camera classification
- scene summary
- prompts
- style

Buttons:

- Save change
- Apply to all related scenes
- Regenerate prompts

---

# 50. PROJECT SYSTEM

Create:

**My Projects**

Each project should save:

- project ID
- project name
- created date
- metadata
- analysis status
- selected provider/model
- scenes
- frames
- structured JSON
- prompts

Original video may be deleted.

---

# 51. EXPORT OPTIONS

Provide:

- Copy prompt
- Copy scene
- Copy all
- Download TXT
- Download Markdown
- Download JSON

Future:

- PDF
- CSV
- ZIP

---

# 52. JSON IS THE SOURCE OF TRUTH

Critical architectural rule.

All analysis must first become structured JSON.

The UI reads JSON.

Prompts read JSON.

Exports read JSON.

Do not make free-form AI text the application's main stored format.

---

# 53. STANDARD ANALYSIS PACKAGE

Create an internal standard format independent of AI provider.

Example:

```json
{
  "project": {},
  "video_metadata": {},
  "selected_frames": [],
  "transcript": [],
  "characters": [],
  "objects": [],
  "locations": [],
  "global_style": {},
  "editing_dna": {},
  "scenes": []
}
```

Every AI provider must produce data compatible with this structure.

---

# 54. VALIDATION

AI output must be validated before saving.

Use:

- Pydantic
- strict schemas
- enum values where practical

If fields are missing:

- retry structured output
- fill safe null values
- never crash frontend

---

# 55. REGENERATION

Do NOT reprocess the entire video if one item is wrong.

Allow:

**Regenerate Scene**

**Regenerate Character**

**Regenerate Prompt**

**Regenerate Style**

Only send the minimum necessary data to the AI provider.

This reduces cost.

---

# 56. CACHING

Generate a hash for:

- video
- scene frames
- AI requests

Possible future benefit:

Avoid repeated identical processing.

Do not overcomplicate V1, but keep architecture cache-friendly.

---

# 57. ERROR HANDLING

Never expose raw developer errors to normal users.

Bad:

```text
429 RESOURCE_EXHAUSTED
```

Good:

```text
Your selected AI provider has reached its current API limit.

Try:
• Another API key
• Another AI provider
• A lighter analysis mode
```

---

# 58. COMMON ERRORS TO HANDLE

Handle at minimum:

- unsupported video format
- file too large
- video longer than 90 seconds
- corrupt file
- FFmpeg failure
- no audio
- no speech
- API key invalid
- API rate limit
- API quota exhausted
- model unavailable
- context length exceeded
- AI timeout
- malformed AI response
- partial analysis failure

---

# 59. PARTIAL FAILURE SUPPORT

If:

Audio analysis fails

but visual analysis succeeds,

do not fail the entire project.

Show:

```text
Visual Analysis: Complete
Audio Analysis: Failed

[ Retry Audio Analysis ]
```

---

# 60. MODEL COMPATIBILITY LAYER

Maintain provider capabilities in configuration.

Example:

```json
{
  "provider": "gemini",
  "model": "example-model",
  "supports_images": true,
  "supports_direct_video": true,
  "supports_audio": true,
  "structured_output": true
}
```

This configuration should be easy to update.

---

# 61. DIRECT VIDEO VS KEYFRAME FALLBACK

Some providers/models may support direct video.

Others may not.

Architecture:

```text
If direct video supported:
    optionally use direct video + selected frames

Else:
    use selected keyframes + transcript + metadata
```

The application must continue working even if a provider does not accept raw video.

---

# 62. COST OPTIMIZATION

The system should reduce AI usage through:

- scene detection
- smart keyframes
- duplicate frame removal
- local audio transcription
- local metadata extraction
- partial regeneration
- caching
- configurable depth modes

Do not send raw full-resolution video to AI unless necessary.

---

# 63. IMAGE RESIZING

Before sending frames to AI:

Create optimized versions.

Keep original extracted frame locally if needed.

Send AI a reasonable resolution.

This reduces:

- bandwidth
- processing
- cost

Do not destroy visual details needed for analysis.

---

# 64. BACKGROUND JOBS

Video processing may take time.

Use a job/task architecture.

Possible V1 options:

- FastAPI background tasks for simple local usage
- queue architecture later

Future:

- Redis
- Celery
- RQ
- Dramatiq

Do not unnecessarily complicate V1.

---

# 65. PROGRESS TRACKING

Create stages:

```text
uploaded
metadata_extracted
scenes_detected
frames_extracted
audio_processed
ai_analysis_started
entities_created
prompts_generated
completed
failed
```

Frontend should poll or use WebSocket/SSE later.

---

# 66. FILE STRUCTURE RECOMMENDATION

Example repository:

```text
project-root/

frontend/
  app/
  components/
  lib/
  types/
  services/

backend/
  app/
    main.py

    api/
    models/
    schemas/

    services/
      video/
        metadata.py
        scene_detection.py
        frame_extraction.py
        similarity.py

      audio/
        extractor.py
        transcription.py

      ai/
        base.py
        gemini.py
        openai.py
        claude.py

      analysis/
        characters.py
        scenes.py
        style.py
        camera.py
        editing.py

      prompts/
        generic.py
        formatters/

    storage/
    database/
    utils/

project-docs/
```

---

# 67. ENVIRONMENT VARIABLES

Create `.env.example`.

Example:

```env
APP_ENV=development

DATABASE_URL=

ENCRYPTION_SECRET=

DEFAULT_AI_PROVIDER=
DEFAULT_AI_MODEL=

GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

UPLOAD_TEMP_DIR=
MAX_VIDEO_DURATION_SECONDS=90
MAX_FILE_SIZE_MB=
```

Never commit real API keys.

---

# 68. DATABASE ENTITIES

Recommended tables/models:

## users
If authentication exists.

## projects

Fields:

- id
- user_id
- name
- status
- created_at
- updated_at
- analysis_mode
- provider
- model

## videos

- project_id
- metadata
- temporary_path
- source_deleted

## scenes

- project_id
- scene_id
- start_time
- end_time
- analysis_json

## characters

- project_id
- character_id
- data_json

## objects

## locations

## prompts

## api_keys

Encrypted.

---

# 69. AUTHENTICATION

For local/private V1, auth may initially be optional.

For SaaS:

Use proper authentication.

Possible future options:

- Clerk
- Supabase Auth
- Auth.js
- custom authentication

Do not build complex auth before core analysis works.

---

# 70. DESIGN STYLE

UI should be:

- clean
- modern
- professional
- beginner-friendly
- minimal
- not overcrowded

Recommended:

Light and dark mode later.

Primary focus:

Video + analysis cards.

Avoid unnecessary animations.

---

# 71. MAIN NAVIGATION

Recommended:

```text
Dashboard
New Analysis
Projects
AI Providers
Settings
```

---

# 72. ANALYSIS PAGE LAYOUT

Desktop recommended layout:

```text
--------------------------------------------------
| Video / Timeline       | Scene Analysis        |
|                        |                       |
|                        |                       |
--------------------------------------------------

Tabs:
Overview | Scenes | Characters | Style | Audio | Editing
```

---

# 73. ORIGINAL / REMIX TOGGLE

On result page:

```text
Mode:

[ Recreate ]
[ Remix ]
```

Remix settings may later offer:

- Change characters
- Change location
- Change colors
- Change props
- Preserve camera
- Preserve pacing
- Preserve transitions

---

# 74. PROMPT COMPILER

Do not ask the multimodal AI to write every final prompt directly each time.

Preferred architecture:

1. AI produces structured analysis.
2. Application stores JSON.
3. Prompt compiler turns JSON into prompts.

Benefits:

- consistency
- cheaper regeneration
- easy target formatting
- editable data
- provider independence

---

# 75. GENERIC IMAGE PROMPT TEMPLATE

Example logic:

```text
[Global Style]

[Character Appearance]

[Pose + Expression]

[Main Action]

[Environment]

[Foreground / Background]

[Composition]

[Camera Angle]

[Estimated Lens Feel]

[Lighting]

[Color Palette]

[Atmosphere]

[Quality / Consistency Rules]
```

---

# 76. GENERIC ANIMATION PROMPT TEMPLATE

Example logic:

```text
Animate this frame while preserving character identity and scene design.

Subject movement:
...

Camera movement:
...

Facial movement:
...

Secondary motion:
...

Hair/cloth physics:
...

Environmental motion:
...

Speed/timing:
...

Transition behavior:
...

Do not:
...
```

---

# 77. GENERIC TEXT-TO-VIDEO TEMPLATE

Example:

```text
Create a [duration]-second scene.

Visual style:
...

Characters:
...

Environment:
...

Action sequence:
...

Camera:
...

Lighting:
...

Motion:
...

VFX:
...

Ending frame:
...

Continuity requirements:
...
```

---

# 78. GLOBAL CONTINUITY RULES

Generate continuity instructions such as:

- keep same face
- keep same hairstyle
- keep same clothing
- preserve object colors
- preserve environment design
- maintain time-of-day
- avoid character identity drift
- preserve scale

---

# 79. COPYRIGHT / ORIGINALITY PRODUCT POSITIONING

Do not market the product as:

**100% Clone Any Video**

Better positioning:

**Turn reference videos into detailed AI recreation blueprints.**

Provide Remix mode so users can create original variations.

Do not make pixel-perfect reproduction claims.

---

# 80. LOGGING

Log:

- processing stage
- project ID
- provider
- model
- request duration
- errors

Never log:

- full API keys
- private secrets
- raw sensitive user data unnecessarily

---

# 81. ANALYTICS FOR OWNER

Future admin dashboard could track:

- projects analyzed
- average duration
- provider usage
- failed jobs
- popular models
- average scene count

Not required for first MVP.

---

# 82. TESTING STRATEGY

Do NOT test only one AI video.

Create a test dataset with at least:

1. Real human talking video
2. 3D animated short
3. 2D cartoon
4. Anime clip
5. Car cinematic
6. Fast action
7. Slow cinematic motion
8. Multiple characters
9. No-dialogue video
10. Music-heavy edit
11. Strong transitions
12. Single continuous shot
13. Vertical 9:16
14. Horizontal video
15. Low-resolution video
16. Dark scene
17. Very bright scene
18. Heavy VFX
19. Screen-recorded / mixed-media
20. AI-generated surreal video

---

# 83. ACCURACY TESTS

Measure:

## Scene Detection

Did scene boundaries roughly match?

## Characters

Were recurring characters kept consistent?

## Camera

Was camera motion identified correctly?

## Actions

Did motion description match?

## Style

Did visual style describe the reference usefully?

## Prompts

Can prompts recreate a similar scene?

---

# 84. PROMPT QUALITY TEST

For selected scenes:

1. Take generated image prompt.
2. Generate an image.
3. Compare with reference.
4. Improve prompt compiler.

Repeat.

For animation:

1. Generate still image.
2. Use animation prompt.
3. Compare camera and subject motion.
4. Refine templates.

This is essential.

---

# 85. MVP ACCEPTANCE CRITERIA

V1 is successful when:

- user can upload a 1–90 sec video
- video metadata is extracted
- scenes are detected
- keyframes are created
- transcript can be generated
- AI provider can analyze selected frames
- characters are identified
- style DNA is created
- each scene receives structured analysis
- each scene gets image prompt
- each scene gets animation prompt
- each scene gets text-to-video prompt
- user can edit analysis
- user can regenerate only one scene
- project can be saved
- result can be exported as JSON/Markdown/TXT
- BYOK API key works
- errors are understandable

---

# 86. DEVELOPMENT PHASES

Do NOT build everything at once.

---

## PHASE 1 — PROJECT FOUNDATION

Build:

- frontend
- backend
- basic dashboard
- upload page
- project creation
- local file processing

No AI yet.

Acceptance:

User uploads video successfully.

---

## PHASE 2 — VIDEO ENGINE

Build:

- FFprobe metadata
- FFmpeg
- scene detection
- keyframe extraction
- thumbnail timeline

Acceptance:

A video is split into meaningful scene cards.

---

## PHASE 3 — AUDIO ENGINE

Build:

- audio extraction
- Whisper transcription
- timestamps

Acceptance:

Dialogue transcript appears.

---

## PHASE 4 — AI PROVIDER SYSTEM

Build abstraction:

- base AI provider
- Gemini adapter first
- key testing
- model configuration

Acceptance:

One scene can be analyzed using Gemini.

---

## PHASE 5 — STRUCTURED SCENE ANALYSIS

Implement:

- JSON schema
- Pydantic validation
- global style
- scenes
- characters
- objects
- locations

Acceptance:

AI analysis returns valid structured JSON.

---

## PHASE 6 — ENTITY CONSISTENCY

Implement:

- character registry
- object registry
- location registry
- merge
- edit
- apply changes globally

---

## PHASE 7 — PROMPT COMPILER

Generate:

- image prompts
- animation prompts
- text-to-video prompts
- negative prompts
- master blueprint

---

## PHASE 8 — RESULTS UI

Build:

- overview
- scene timeline
- character cards
- style tab
- audio tab
- editing tab
- master blueprint

---

## PHASE 9 — BYOK

Add:

- API provider settings
- encrypted keys
- model selection
- test connection
- delete key

---

## PHASE 10 — EDITING + REGENERATION

Allow:

- edit scene
- edit character
- regenerate scene
- regenerate prompt
- split scene
- merge scene

---

## PHASE 11 — EXPORT

Add:

- JSON
- Markdown
- TXT

---

## PHASE 12 — POLISH + TESTING

Test many video types.

Optimize:

- frame count
- cost
- speed
- output quality
- error messages

---

# 87. RULES FOR THE CODING AI

The coding assistant MUST follow these rules.

1. Do not rewrite the entire application unnecessarily.
2. Build one phase at a time.
3. Before implementing a phase, inspect the existing code.
4. Do not remove working features unless required.
5. Keep code modular.
6. Avoid giant files.
7. Use clear naming.
8. Use TypeScript on frontend.
9. Use Pydantic schemas on backend.
10. Validate AI JSON.
11. Keep AI provider abstraction clean.
12. Never hard-code secret keys.
13. Never expose server secrets to frontend.
14. Never store user API keys unencrypted.
15. Use structured logging.
16. Write clear error messages.
17. Add comments only where useful.
18. Avoid unnecessary overengineering.
19. Prefer stable libraries.
20. Keep V1 focused on Shorts only.

---

# 88. IMPORTANT AI INSTRUCTIONS

When using an AI model to analyze a scene:

Do NOT ask:

> Describe this video.

Instead ask for structured production analysis.

The model should behave as:

- cinematographer
- animation director
- VFX supervisor
- editor
- prompt engineer
- visual analyst

It should describe only visible/inferable information.

It should identify uncertainty.

It should not invent unsupported details.

---

# 89. EXAMPLE SYSTEM INSTRUCTION FOR SCENE AI

Use a concept similar to:

```text
You are a professional cinematography, animation, VFX, editing, and AI prompt-analysis engine.

Your task is to analyze the supplied scene frames, timestamps, transcript, and video metadata.

Do not merely summarize the scene.

Extract structured production information that would allow another creator to reproduce a visually similar scene using AI image and video generation tools.

Carefully analyze:

characters,
appearance,
clothing,
pose,
expression,
actions,
objects,
environment,
foreground,
background,
camera shot,
camera angle,
camera motion,
lens feel,
lighting,
composition,
color palette,
subject motion,
secondary motion,
physics,
VFX,
editing,
transitions,
dialogue,
sound effects,
continuity.

Distinguish verified file metadata from visual estimates.

If uncertain, mark the field as estimated and lower confidence.

Return valid JSON matching the provided schema only.
```

---

# 90. FUTURE FEATURES — DO NOT BUILD IN V1

Keep space for future:

- long video mode
- documentary analysis
- full movie/episode breakdown
- direct image generation
- direct video generation
- automated regeneration comparisons
- browser extension
- YouTube URL import
- TikTok/Reels import
- batch processing
- team workspace
- cloud storage
- credit billing
- mobile app
- automatic prompt optimization
- AI learning mode
- engagement/hook analysis
- story structure analysis
- reference-to-original story generator

Do not implement these before core V1 works.

---

# 91. OWNER BUSINESS MODEL OPTIONS

Future possible plans:

## Basic
Default limited AI

## BYOK
User provides own API key

## Pro
Owner provides hosted AI credits

This architecture should support all three later.

---

# 92. FINAL PRODUCT DEFINITION

The application should ultimately behave like this:

> A user uploads any short-form reference video.  
> The system automatically detects shots, extracts meaningful frames, analyzes visual and audio elements, identifies recurring characters, objects and locations, understands style, camera, motion, lighting, VFX, editing and transitions, then converts everything into structured scene data and AI-generation-ready prompts.

The most important product principle:

> **Do not simply describe the video. Convert the video into production instructions.**

---

# 93. FIRST COMMAND TO GIVE THE CODING AI

After giving the AI this document, use:

```text
Read the complete project specification carefully.

Do not start coding the full application yet.

First:
1. Summarize your understanding of the architecture.
2. Identify any technical risks or contradictions.
3. Propose the final repository structure.
4. List all required dependencies.
5. Define the Phase 1 implementation plan.
6. Do not implement Phase 2 or later until Phase 1 is working.

After that, begin Phase 1 only.

Preserve this specification as the source of truth throughout development.
```

---

# 94. SECOND COMMAND AFTER PHASE 1

```text
Review the current codebase and confirm Phase 1 is working.

Do not rewrite working code.

Now implement Phase 2: the local video processing engine.

Requirements:
- FFprobe metadata extraction
- FFmpeg integration
- PySceneDetect
- smart scene segmentation
- keyframe extraction
- basic duplicate frame removal
- scene timeline data
- clean error handling

Do not add AI analysis yet.

Test the implementation before moving forward.
```

---

# 95. DEVELOPMENT PRINCIPLE

Always follow:

```text
Plan
→ Build
→ Test
→ Fix
→ Confirm
→ Move to next phase
```

Never:

```text
Generate entire app in one giant prompt
```

because this usually creates unstable code.

---

# END OF SPECIFICATION
