const findFixedAncestor = require('./getElementFixedAncestor')
const getElementInnerOffset = require('./getElementInnerOffset')
const getDocumentScrollingElement = require('./getDocumentScrollingElement')

module.exports = function getElementRect([element, isClient = false] = []) {
  if (element === document.documentElement || element.tagName.toLowerCase() === getDocumentScrollingElement()) {
    return {x: 0, y: 0, width: element.clientWidth, height: element.clientHeight}
  }

  const elementBoundingClientRect = element.getBoundingClientRect()
  const rect = {
    x: elementBoundingClientRect.left,
    y: elementBoundingClientRect.top,
    width: elementBoundingClientRect.width,
    height: elementBoundingClientRect.height,
  }
  if (isClient) {
    const elementComputedStyle = window.getComputedStyle(element)
    rect.x += parseInt(elementComputedStyle.getPropertyValue('border-left-width'))
    rect.y += parseInt(elementComputedStyle.getPropertyValue('border-top-width'))
    rect.width = element.clientWidth
    rect.height = element.clientHeight
  }
  const fixedAncestor = findFixedAncestor([element])
  if (fixedAncestor) {
    if (fixedAncestor !== element) {
      const fixedAncestorInnerOffset = getElementInnerOffset([fixedAncestor])
      rect.x += fixedAncestorInnerOffset.x
      rect.y += fixedAncestorInnerOffset.y
    }
  } else {
    const documentInnerOffset = getElementInnerOffset()
    rect.x += documentInnerOffset.x
    rect.y += documentInnerOffset.y
  }
  return rect
}
