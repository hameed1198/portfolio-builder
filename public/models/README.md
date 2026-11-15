# Avatar model drop-in

Place your final rigged character here:

```
public/models/hameed-avatar.glb
```

`HameedAvatar` probes this path on load. When the file exists, the GLB replaces the
procedural stand-in in **every** intro shot and in the Hero — no code changes required.
The same `AvatarController` drives both, so timings and poses stay in sync.

## Conventions

- Units: meters. Feet at the origin, character facing **+Z** (glTF default), ~1.8 m tall.
- Eye height ≈ 1.67 m (the sunglasses close-up frames this height — see `lib/intro/introConfig.ts`).
- Name a head bone containing `Head` for cursor look-at in the Hero.
- Name the sunglasses lens meshes so they match `/lens|glass|sunglass/i`
  (`avatarConfig.lensMeshPattern`). They get the dark reflective Matrix-code lens material.

## Animation clips

Clip names are matched case-insensitively (a name *containing* the key also matches):

| Clip               | Used in                              | Loop  |
| ------------------ | ------------------------------------ | ----- |
| `idle`             | Frames 01–03                         | loop  |
| `breathing`        | Always, layered additively           | loop  |
| `adjustSunglasses` | Frame 04                             | once  |
| `walking`          | Frames 05–06 (in place, no root motion) | loop |
| `lookUp`           | Frame 07                             | loop  |
| `heroPose`         | Frames 08–09                         | loop  |
| `sitting`          | Frame 10 → Hero (stand → seated, holds last frame) | once |
| `typing`           | Seated typing (optional)             | loop  |

Missing clips fall back to `idle`. Walk clips should be **in place** — the timeline moves the
character and the stride speed is derived from that movement.

## Compression

Draco decoders are self-hosted in `public/draco/`. Compress with
[gltf-transform](https://gltf-transform.dev/):

```bash
npx @gltf-transform/cli optimize hameed-avatar-source.glb public/models/hameed-avatar.glb \
  --compress draco --texture-compress webp --texture-size 2048
```

Aim for ~20k–60k triangles and 2K (or smaller) textures.
