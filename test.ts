import { Tiny } from "./src/module/tiny"

describe("Math functions", () => {
  test("should add two numbers correctly", () => {
    const div = document.createElement("div")
    const state = Tiny.reactive({
      count: 0,
    })
    class Button extends Tiny.component {
      get html(): string {
        return "<button>test</button>"
      }
    }
    const button = new Button({
      el: div,
      props: state,
      styles: {
        marginLeft() {
          return `${state.count}px`
        },
      },
      events: {
        click() {
          state.count += 1
        },
      },
    })
    div.click()
    expect(state.count).toBe(1)
  })
})
