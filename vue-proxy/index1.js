const data = {
    foo: true,
    bar: true
}

const bucket = new WeakMap()

let activeEffect;
const effectStack = [] // 新增
function effect(fn) {
    function effectFn() {
        activeEffect = effectFn
        cleanup(effectFn)
        effectStack.push(effectFn)
        fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
    }
    effectFn.deps = []
    effectFn()
}


function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps.length = 0
}




const obj = new Proxy(data, {
    get(target, key) {
        getData(target, key)
        return target[key]
    },
    set(target, key, value) {
        target[key] = value
        setData(target, key)
    }
})

function getData(target, key) {
    if (!activeEffect) return
    let tempMap = bucket.get(target)
    if (!tempMap) {
        bucket.set(target, (tempMap = new Map()))
    }
    let temp = tempMap.get(key)
    if (!temp) {
        tempMap.set(key, (temp = new Set()))
    }
    temp.add(activeEffect)
    activeEffect.deps.push(temp)
}

function setData(target, key) {
    const tempData = bucket.get(target)
    if (!tempData) return
    const effect = tempData.get(key)
    const temp = new Set(effect)
    temp && temp.forEach(fn => fn())
}

let temp1;
let temp2;
effect(() => {
    console.log('执行1')
    effect(() => {
        temp2= obj.bar
        console.log('执行2')
    })
    temp1 = obj.foo
})


obj.foo = 1
// setTimeout(() => {
//     obj.show = false
//     setTimeout(() => {
//         obj.text = '1'
//     }, 2000)
// }, 2000)
