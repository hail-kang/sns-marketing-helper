import { v4 as uuidv4 } from "uuid"

export class Tiny {
  private static $instance: Tiny
  private $dependecies: Map<string, Set<Component>> = new Map()

  private constructor() {}

  public static get component(): typeof Component {
    return Component
  }

  public static getInstance(): Tiny {
    if (!Tiny.$instance) {
      Tiny.$instance = new Tiny()
    }
    return Tiny.$instance
  }

  public static reactive(target: Record<string, any>): Reactive {
    const handler = {
      get(obj: Reactive, prop: string) {
        return Reflect.get(obj, prop)
      },
      set(obj: Reactive, prop: string, value: any) {
        const oldValue = obj[prop]
        const result = Reflect.set(obj, prop, value)
        if (oldValue !== value) {
          const components = Tiny.getInstance().$dependecies.get(obj.id)
          if (components) {
            components.forEach((component) => component.render())
          }
        }
        return result
      },
    }
    const reactive = new Reactive(target)
    return new Proxy(reactive, handler)
  }

  public register(reactive: Reactive, component: Component) {
    const componentSet = this.$dependecies.get(reactive.id)
    if (!componentSet) {
      this.$dependecies.set(reactive.id, new Set([component]))
    } else {
      componentSet.add(component)
    }
    component.render()
  }
}

export class Reactive {
  private $id: string;
  [key: string]: any
  get id() {
    return this.$id
  }
  public constructor(data: Object) {
    this.$id = uuidv4()
    Object.assign(this, data)
  }
}

abstract class Component {
  private $el: HTMLElement
  private $props?: Reactive
  private $events?: Map<string, Function>
  private $styles?: Map<string, () => string>

  constructor({
    el,
    props,
    events,
    styles,
  }: {
    el: HTMLElement
    props?: Reactive
    events?: Record<string, Function>
    styles?: Record<string, () => string>
  }) {
    this.$el = el
    this.$props = props
    if (events) {
      this.$events = new Map(Object.entries(events))
    }
    if (styles) {
      this.$styles = new Map(Object.entries(styles))
    }
    if (this.$props) {
      Tiny.getInstance().register(this.$props, this)
    }
  }

  public abstract get html(): string

  public render() {
    this.$el.innerHTML = this.html
    this.$styles?.forEach((styleFunc, styleName: string) => {
      if (this.$el) {
        this.$el.style[styleName as any] = styleFunc()
      }
    })
    this.$events?.forEach((eventFunc, eventName) => {
      this.$el.addEventListener(
        eventName as keyof DocumentEventMap,
        eventFunc as EventListener,
      )
    })
  }
}
