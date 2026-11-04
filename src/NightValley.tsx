import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

type NightValleyProps = {
  hovering: boolean
  traveling: boolean
  onLoaded: () => void
  onIntroDone: () => void
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDisperse;
  uniform vec2 uMouse;
  attribute float aScale;
  attribute float aPhase;
  attribute vec3 aScatter;
  varying vec3 vColor;
  varying float vGlow;
  varying float vOpacity;

  void main() {
    vec3 transformed = position;
    float flutter = sin(uTime * 0.42 + aPhase * 10.0) * 0.07;
    transformed.y += flutter;
    transformed += aScatter * uDisperse * (2.0 + aScale * 4.2);

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    vec4 clipPosition = projectionMatrix * viewPosition;
    vec2 screenPosition = clipPosition.xy / max(clipPosition.w, 0.001);
    vec2 delta = screenPosition - uMouse;
    float distanceToMouse = length(delta);
    float push = smoothstep(0.30, 0.0, distanceToMouse);
    vec2 direction = normalize(delta + vec2(0.0001));
    clipPosition.xy += direction * push * 0.105 * clipPosition.w;

    float depth = max(-viewPosition.z, 0.1);
    float nearGrowth = 1.0 - smoothstep(11.0, 72.0, depth);
    float pointSize = (4.0 + aScale * 11.0) * (245.0 / depth);
    gl_PointSize = clamp(pointSize * (0.34 + nearGrowth * 0.82), 1.0, 34.0);
    gl_Position = clipPosition;

    vColor = color;
    vGlow = push;
    vOpacity = 0.10 + nearGrowth * 0.48;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vGlow;
  varying float vOpacity;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float angle = atan(point.y, point.x);
    float petals = 0.31 + 0.075 * cos(angle * 5.0);
    float alpha = smoothstep(petals, petals - 0.095, radius);
    float centre = smoothstep(0.17, 0.0, radius);

    if (alpha < 0.01) discard;
    vec3 colour = vColor * (1.0 + centre * 0.55 + vGlow * 1.25);
    gl_FragColor = vec4(colour, alpha * vOpacity * (0.72 + centre * 0.28));
  }
`

function NightValley({ hovering, traveling, onLoaded, onIntroDone }: NightValleyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hoveringRef = useRef(hovering)
  const travelingRef = useRef(traveling)

  useEffect(() => {
    hoveringRef.current = hovering
  }, [hovering])

  useEffect(() => {
    travelingRef.current = traveling
  }, [traveling])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frameId = 0
    let introTimer = 0
    let isDisposed = false

    try {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#010303')
      scene.fog = new THREE.FogExp2('#010303', 0.026)

      const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 150)
      camera.position.set(0, 1.25, 8)

      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.64
      renderer.domElement.setAttribute('aria-hidden', 'true')
      container.appendChild(renderer.domElement)

      const composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.64,
        0.52,
        0.42,
      )
      composer.addPass(bloom)
      composer.addPass(new OutputPass())

      const flowerCount = window.innerWidth <= 820 ? 4200 : 7200
      const positions = new Float32Array(flowerCount * 3)
      const colours = new Float32Array(flowerCount * 3)
      const scales = new Float32Array(flowerCount)
      const phases = new Float32Array(flowerCount)
      const scatter = new Float32Array(flowerCount * 3)
      const palette = ['#f5efe2', '#c7a5ff', '#8d63ff', '#ee84d6', '#77d8cc', '#efb7d7']
      const colour = new THREE.Color()

      for (let i = 0; i < flowerCount; i += 1) {
        const i3 = i * 3
        const side = Math.random() > 0.5 ? 1 : -1
        const distanceFromPath = 1.45 + Math.pow(Math.random(), 0.72) * 12.8
        const z = 6 - Math.random() * 104
        const x = side * distanceFromPath + Math.sin(z * 0.13) * 0.85
        const valleyRise = Math.pow(Math.abs(x) / 12.8, 1.42) * 5.2
        const y = -3.1 + valleyRise + Math.random() * 2.25 + Math.sin(z * 0.17) * 0.32

        positions[i3] = x
        positions[i3 + 1] = y
        positions[i3 + 2] = z

        colour.set(palette[Math.floor(Math.random() * palette.length)])
        const shade = 0.28 + Math.random() * 0.55
        colours[i3] = colour.r * shade
        colours[i3 + 1] = colour.g * shade
        colours[i3 + 2] = colour.b * shade

        scales[i] = 0.45 + Math.pow(Math.random(), 2) * 1.8
        phases[i] = Math.random()
        scatter[i3] = side * (0.28 + Math.random() * 1.15)
        scatter[i3 + 1] = -0.18 + Math.random() * 1.35
        scatter[i3 + 2] = -0.4 + Math.random() * 0.8
      }

      const flowerGeometry = new THREE.BufferGeometry()
      flowerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      flowerGeometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
      flowerGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
      flowerGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
      flowerGeometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))

      const flowerUniforms = {
        uTime: { value: 0 },
        uDisperse: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      }
      const flowerMaterial = new THREE.ShaderMaterial({
        uniforms: flowerUniforms,
        vertexShader,
        fragmentShader,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const flowers = new THREE.Points(flowerGeometry, flowerMaterial)
      scene.add(flowers)

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(34, 130, 1, 1),
        new THREE.MeshBasicMaterial({ color: '#020a08' }),
      )
      floor.rotation.x = -Math.PI / 2
      floor.position.set(0, -3.2, -48)
      scene.add(floor)

      const dustCount = window.innerWidth <= 820 ? 450 : 900
      const dustPositions = new Float32Array(dustCount * 3)
      for (let i = 0; i < dustCount; i += 1) {
        const i3 = i * 3
        dustPositions[i3] = (Math.random() - 0.5) * 22
        dustPositions[i3 + 1] = -1.4 + Math.random() * 9
        dustPositions[i3 + 2] = 8 - Math.random() * 110
      }
      const dustGeometry = new THREE.BufferGeometry()
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
      const dustMaterial = new THREE.PointsMaterial({
        color: '#d8d1ff',
        size: 0.055,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const dust = new THREE.Points(dustGeometry, dustMaterial)
      scene.add(dust)

      const mouseTarget = new THREE.Vector2(0, 0)
      const mouse = new THREE.Vector2(0, 0)
      let targetProgress = 0
      let progress = 0
      let velocity = 0
      let lastTouchY = 0

      const onPointerMove = (event: PointerEvent) => {
        mouseTarget.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
      }
      const onPointerLeave = () => mouseTarget.set(0, 0)
      const onWheel = (event: WheelEvent) => {
        targetProgress = THREE.MathUtils.clamp(targetProgress + event.deltaY * 0.00014, 0, 0.985)
      }
      const onTouchStart = (event: TouchEvent) => {
        lastTouchY = event.touches[0]?.clientY ?? 0
      }
      const onTouchMove = (event: TouchEvent) => {
        const currentY = event.touches[0]?.clientY ?? lastTouchY
        targetProgress = THREE.MathUtils.clamp(targetProgress + (lastTouchY - currentY) * 0.0019, 0, 0.985)
        lastTouchY = currentY
      }
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
        renderer.setSize(window.innerWidth, window.innerHeight)
        composer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onPointerLeave)
      window.addEventListener('wheel', onWheel, { passive: true })
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: true })
      window.addEventListener('resize', onResize)

      const clock = new THREE.Clock()
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let firstFrame = true

      const render = () => {
        if (isDisposed) return
        const delta = Math.min(clock.getDelta(), 0.04)
        const elapsed = clock.elapsedTime
        const isHovering = hoveringRef.current
        const isTraveling = travelingRef.current

        if (isTraveling) {
          targetProgress = 0.985
        } else if (!isHovering && !reduceMotion) {
          targetProgress = Math.min(0.985, targetProgress + delta * 0.0023)
        }

        const previous = progress
        progress = THREE.MathUtils.lerp(progress, targetProgress, isTraveling ? 0.12 : isHovering ? 0.018 : 0.048)
        velocity = THREE.MathUtils.lerp(velocity, Math.abs(progress - previous) / Math.max(delta, 0.001), 0.1)
        mouse.lerp(mouseTarget, 0.045)

        const pathZ = 8 - progress * 82
        const pathX = Math.sin(progress * 8.4) * 1.05 + mouse.x * 0.24
        const pathY = 1.15 + Math.sin(progress * 12.0) * 0.32 + mouse.y * 0.18
        camera.position.set(pathX, pathY, pathZ)
        camera.lookAt(pathX * 0.24 + mouse.x * 0.34, -0.35 + mouse.y * 0.16, pathZ - 15)
        camera.rotation.z += -mouse.x * 0.012
        camera.fov = THREE.MathUtils.lerp(camera.fov, isTraveling ? 74 : 54, 0.08)
        camera.updateProjectionMatrix()

        flowerUniforms.uTime.value = elapsed
        flowerUniforms.uMouse.value.copy(mouse)
        flowerUniforms.uDisperse.value = THREE.MathUtils.lerp(
          flowerUniforms.uDisperse.value,
          isTraveling ? 2.1 : isHovering ? 1 : 0,
          isTraveling ? 0.09 : isHovering ? 0.035 : 0.055,
        )
        bloom.strength = THREE.MathUtils.lerp(bloom.strength, isTraveling ? 1.35 : 0.64, 0.06)
        dust.rotation.y = elapsed * 0.002
        dust.position.y = Math.sin(elapsed * 0.15) * 0.08
        ;(container.parentElement ?? container).style.setProperty('--travel-speed', String(Math.min(1, velocity * 10)))

        composer.render()
        if (firstFrame) {
          firstFrame = false
          onLoaded()
          introTimer = window.setTimeout(onIntroDone, reduceMotion ? 40 : 900)
        }
        frameId = window.requestAnimationFrame(render)
      }
      render()

      return () => {
        isDisposed = true
        window.cancelAnimationFrame(frameId)
        window.clearTimeout(introTimer)
        window.removeEventListener('pointermove', onPointerMove)
        document.documentElement.removeEventListener('pointerleave', onPointerLeave)
        window.removeEventListener('wheel', onWheel)
        window.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('resize', onResize)
        flowerGeometry.dispose()
        flowerMaterial.dispose()
        dustGeometry.dispose()
        dustMaterial.dispose()
        floor.geometry.dispose()
        ;(floor.material as THREE.Material).dispose()
        composer.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    } catch {
      container.classList.add('valley-fallback')
      onLoaded()
      introTimer = window.setTimeout(onIntroDone, 120)
    }

    return () => {
      isDisposed = true
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(introTimer)
    }
  }, [onIntroDone, onLoaded])

  return <div ref={containerRef} className="valley-canvas" aria-hidden="true" />
}

export default NightValley
