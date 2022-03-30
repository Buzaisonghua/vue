const bucket = new WeakMap()

const data = {
    show: true,
    text: 'hello word'
}

let activeEffect;

function  effect(fn) {
    const effectFn =() => {
        cleanup(effectFn)
        activeEffect = effectFn
        fn()
    }
    effectFn.deps = []
    effectFn()
}

const obj = new Proxy(data, {
    get(target, key) {
        getData(target, key)
        return target[key]
    },
    set(target, key,  value) {
        target[key] = value
        setData(target, key)
    }
})

function getData(target, key) {
    console.log('get')
    if (!activeEffect) return
    let depsMap = bucket.get(target)
    if (!depsMap) {
        bucket.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if (!deps) { depsMap.set(key, (deps = new Set())) }
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}


function setData(target, key) {
    console.log('set')
    const depsData = bucket.get(target)
    if (!depsData) return
    const deps = depsData.get(key)
    const effect = new Set(deps)
    effect.forEach(fn => fn())
}

function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps.length = 0
}

effect(() => {
    document.body.innerHTML =  obj.show ? obj.text : '111'
})

setTimeout(() => {
    obj.show = false
    setTimeout(() => {
        console.log(1)
        obj.text = '1111'
    }, 2000)
}, 2000)