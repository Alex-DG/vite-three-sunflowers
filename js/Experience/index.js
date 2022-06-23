import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

import modelSrc from '../../assets/models/tank.glb'
import sunflowerSrc from '../../assets/models/sunflower.glb'

class Experience {
  constructor(options) {
    // Experience parameters
    this.container = options.domElement
    this.count = options.count || 5000

    this.scene = new THREE.Scene()

    // Loaders
    this.loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
    )
    this.loader.setDRACOLoader(dracoLoader)

    this.isSceneReady = false

    // Mouse tracking
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    // Mesh Surface Sampler / Instanced Mesh - Setup
    this.ages = new Float32Array(this.count)
    this.growthSpeed = new Float32Array(this.count) // each sunflower has a different growth speed
    this.scales = new Float32Array(this.count)
    this.dummy = new THREE.Object3D()

    this.currentPoint = new THREE.Vector3()
    this.position = new THREE.Vector3()
    this.positions = []
    this.normal = new THREE.Vector3()
    this.normals = []
    this.scale = new THREE.Vector3()

    // Start experience
    this.init()
  }

  /**
   * Experience setup
   */
  init() {
    this.bind()

    this.setSizes()
    this.setRenderer()
    this.setCamera()
    this.setLights()
    this.setResize()

    this.loadObjects()

    this.update()

    console.log('🤖', 'Experience initialized')
  }

  bind() {
    this.onResize = this.onResize.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)

    this.update = this.update.bind(this)
  }

  //////////////////////////////////////////////////////////////////////////////

  rescaleSunflower(index) {
    this.dummy.position.copy(this.positions[index])
    const distance = this.currentPoint.distanceTo(this.positions[index])

    if (distance < 0.5) {
      this.growthSpeed[index] += 0.0025
    } else {
      this.growthSpeed[index] *= 0.9
    }

    this.scales[index] += this.growthSpeed[index]
    this.scales[index] = Math.min(1, this.scales[index])

    const scale = this.scales[index]
    this.dummy.scale.set(scale, scale, scale)
    this.dummy.lookAt(this.normals[index])
    this.dummy.updateMatrix()

    this.flowers.setMatrixAt(index, this.dummy.matrix)
  }

  hideLoading() {
    const loadingDom = document.getElementById('loading')
    loadingDom.style.opacity = '0'

    this.isSceneReady = true
    this.setMouse()
  }

  //////////////////////////////////////////////////////////////////////////////

  onResize() {
    // Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(
      this.model.children[0].children
    )

    if (intersects.length > 0) {
      // console.log({ found: intersects[0].object.name })
      this.currentPoint.copy(intersects[0].point)
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  setInstancedMesh() {
    // https://www.youtube.com/watch?v=jmsw7ZLASkg at 00:40:00 mins
    this.sampler = new MeshSurfaceSampler(this.mergedGeometriesMesh)
      .setWeightAttribute('uv')
      .build()

    const geometry = this.sunflower.geometry //new THREE.BoxBufferGeometry(0.01, 0.01, 1)
    const material = this.sunflower.material //new THREE.MeshStandardMaterial({ color: 0x00ff00 })

    this.flowers = new THREE.InstancedMesh(geometry, material, this.count)
    this.flowers.receiveShadow = true
    this.flowers.castShadow = true

    for (let i = 0; i < this.count; i++) {
      this.ages[i] = 0 //Math.random()
      this.scales[i] = this.ages[i] //scaleCurve(this.ages[i])
      this.growthSpeed[i] = 0

      // Resample particle
      this.sampler.sample(this.position, this.normal)
      this.normal.add(this.position)

      this.dummy.position.copy(this.position)
      this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i])
      this.dummy.lookAt(this.normal)
      this.dummy.updateMatrix()

      this.flowers.setMatrixAt(i, this.dummy.matrix)

      this.positions.push(this.position.clone())
      this.normals.push(this.normal.clone())
    }

    this.flowers.instanceMatrix.needsUpdate = true

    this.scene.add(this.flowers)
  }

  setSizes() {
    this.sizes = {
      width: this.container.offsetWidth,
      height: this.container.offsetHeight || window.innerHeight,
    }
  }

  setCamera() {
    // Base camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.001,
      1000
    )

    const position = 2
    this.camera.position.set(position, position, position)

    this.scene.add(this.camera)

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.physicallyCorrectLights = true
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.container.appendChild(this.renderer.domElement)
  }

  setLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.3)
    this.scene.add(light1)

    this.light2 = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI)
    this.light2.position.set(2.7, 3.0) // ~60deg

    this.light2.castShadow = true
    this.light2.shadow.bias = -0.01
    this.light2.shadow.mapSize.width = 1024
    this.light2.shadow.mapSize.height = 1024

    this.light2.shadow.camera.near = 0.1
    this.light2.shadow.camera.far = 20
    this.light2.shadow.camera.right = 10
    this.light2.shadow.camera.left = -10
    this.light2.shadow.camera.top = 10
    this.light2.shadow.camera.bottom = -10

    this.scene.add(this.light2)
  }

  setTank(tankModel) {
    if (tankModel) {
      let objectGeometries = []

      this.model = tankModel.scene
      this.model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true

          child.geometry.computeVertexNormals() // Computes vertex normals by averaging face normals https://threejs.org/docs/#api/en/core/BufferGeometry.computeVertexNormals
          objectGeometries.push(child.geometry)
        }
      })

      const mergedGeometries = mergeBufferGeometries(objectGeometries)
      const mergedGeometriesMat = new THREE.MeshNormalMaterial()
      this.mergedGeometriesMesh = new THREE.Mesh(
        mergedGeometries,
        mergedGeometriesMat
      )

      // this.scene.add(mergedGeometriesMesh)
      this.scene.add(this.model)
    }
  }

  setSunflower(sunflowerModel) {
    if (sunflowerModel) {
      this.sunflower = sunflowerModel.scene.children[0].children[0].children[0]

      const material = this.sunflower.material
      const map = material.map

      material.emissive = new THREE.Color('#FFFF00')
      material.emissiveIntensity = 0.8
      material.emissiveMap = map
      material.color.convertSRGBToLinear()
      map.encoding = THREE.sRGBEncoding

      const scale = 0.003
      this.sunflower.geometry.scale(scale, scale, scale) // can be done with blender 1st, to optimise the code!
    }
  }

  setResize() {
    window.addEventListener('resize', this.onResize)
  }

  setMouse() {
    window.addEventListener('pointermove', this.onPointerMove)
  }

  //////////////////////////////////////////////////////////////////////////////

  async loadObjects() {
    const [tankModel, sunflowerModel] = await Promise.all([
      this.loader.loadAsync(modelSrc),
      this.loader.loadAsync(sunflowerSrc),
    ])

    this.setTank(tankModel)
    this.setSunflower(sunflowerModel)
    this.setInstancedMesh()

    setTimeout(() => {
      this.hideLoading()
    }, 200)
  }

  //////////////////////////////////////////////////////////////////////////////

  updateSunflowers() {
    for (let index = 0; index < this.count; index++) {
      this.rescaleSunflower(index)
    }
    this.flowers.instanceMatrix.needsUpdate = true
  }

  update() {
    if (this.isSceneReady) {
      this.updateSunflowers()

      // Update controls
      this.controls.update()

      // Render
      this.renderer.render(this.scene, this.camera)
    }

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
