import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import modelSrc from '../../assets/models/tank.glb'
console.log({ modelSrc })
class Experience {
  constructor(options) {
    this.scene = new THREE.Scene()

    this.loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
    )
    this.loader.setDRACOLoader(dracoLoader)

    this.container = options.domElement

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
    this.setTank()
    this.setResize()
    this.update()

    console.log('🤖', 'Experience initialized')
  }

  bind() {
    this.resize = this.resize.bind(this)
    this.update = this.update.bind(this)
  }

  resize() {
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

  //////////////////////////////////////////////////////////////////////////////

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
    this.camera.position.set(1, 1, 1)
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
    this.renderer.shadowMap.type = THREE.PCFShadowMap
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

  setTank() {
    this.loader.load(modelSrc, (gltf) => {
      console.log({ gltf })
      this.tank = gltf.scene
      this.tank.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      this.scene.add(this.tank)
    })
  }

  setResize() {
    window.addEventListener('resize', this.resize)
  }

  //////////////////////////////////////////////////////////////////////////////

  update() {
    // Update controls
    this.controls.update()

    // Render
    this.renderer.render(this.scene, this.camera)

    // Call update again on the next frame
    window.requestAnimationFrame(this.update)
  }
}

export default Experience
