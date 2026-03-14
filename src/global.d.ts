export {}
declare global {
  interface Window {
    Node: typeof Node
    Function: typeof Function
    MutationObserver: typeof MutationObserver
    HTMLIFrameElement: typeof HTMLIFrameElement
    HTMLElement: typeof HTMLElement
    Element: typeof Element
    DocumentFragment: typeof DocumentFragment
    HTMLFrameElement: typeof HTMLFrameElement
    HTMLObjectElement: typeof HTMLObjectElement
  }
}
