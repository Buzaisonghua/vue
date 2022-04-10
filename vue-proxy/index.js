const bucket = new WeakMap()

const data = {
    text: 'hello word',
    show: true
}

let activeEffect;
function effect(fn) {
    function effectFn() {
        cleanup(effectFn)
        activeEffect = effectFn
        fn()
    }
    effectFn.deps = []
    effectFn()
}

function cleanup(effectFn) {
    for(let i = 0; i < effectFn.deps.length; i++ ) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps = []
}

const obj = new Proxy(data, {
    get(target, key){
        getData(target, key)
        return target[key]
    },
    set(target, key, value) {
        target[key] = value
        setData(target, key)
    }
})

function getData(target, key) {
    console.log('get');
    if (!activeEffect) return
    let dempMap = bucket.get(target)
    if (!dempMap) bucket.set(target, (dempMap = new Map))
    let demp = dempMap.get(key)
    if (!demp) dempMap.set(key, (demp = new Set()))
    demp.add(activeEffect)
    activeEffect.deps.push(demp)
}

function setData(target, key) {
    console.log('set')
    const dempMap = bucket.get(target)
    if (!dempMap) return
    const demp = dempMap.get(key)
    const effect = new Set(demp)
    effect && effect.forEach(fn => fn())
}

effect(() => {
    document.body.innerHTML = obj.show ? obj.text : '1111'
})

setTimeout(() => {
    obj.show = false
    setTimeout(() => {
        obj.text = '1111'
    }, 200)
}, 200)