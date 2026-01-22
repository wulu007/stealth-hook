/**
 * 获取对象属性描述符，包含原型链上的属性
 * @param obj 目标对象
 * @param prop 属性名
 * @returns 属性描述符或 undefined
 */
export const getDescriptor = (() => {
  const $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  const $getPrototypeOf = Object.getPrototypeOf
  return function (obj: any, prop: PropertyKey) {
    let curr = obj
    while (curr) {
      const desc = $getOwnPropertyDescriptor(curr, prop)
      if (desc)
        return desc
      curr = $getPrototypeOf(curr)
    }
    return undefined
  }
})()
