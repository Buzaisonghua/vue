const bucket = new WeakMap()

const data = {
    show: true, 
    text: 'hello word',
    num: 0
}

let activeEffect;
const effectStack = []

function effect(fn, options = {}) {
    function effectFn() {
        cleanup(effectFn)
        activeEffect = effectFn
        effectStack.push(effectFn)
        fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
    }
    effectFn.options = options
    effectFn.deps = []
    effectFn()
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
    // console.log('get', key)
    if (!activeEffect) return
    let depsMap = bucket.get(target)
    if (!depsMap) bucket.set(target, (depsMap = new Map()))
    let deps = depsMap.get(key)
    if (!deps) depsMap.set(key, (deps = new Set()))
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}

function setData(target, key) {
    const depsMap = bucket.get(target)
    if (!depsMap) return
    const effect = depsMap.get(key)
    const deps = new Set()
    // 增加守卫条件：如果get时触发的副作用函数与当前正在执行的副作用函数相同，则不触发
    effect && effect.forEach(effectFn => {
        if (effectFn !== activeEffect) {
            deps.add(effectFn)
        }
    })
    deps && deps.forEach(fn => {
        if (fn.options.scheduler) {
            fn.options.scheduler(fn)
        } else {
            fn()
        } 
    })
}


function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    effectFn.deps.length = 0
}

let temp1, temp2

// effect(function effectFn1() {
//     // document.body.innerHTML = obj.num
//     obj.num ++
// })

// setTimeout(() => {
//     obj.num++
//     // setTimeout(() => {
//         // obj.text = '1111'
//     // })
// }, 1000)


// 定义一个任务队列
const jobQueue = new Set()
// 使用Promise.resolve()创建一个promise实例， 我们用它将一个任务添加到微任务队列
const p = Promise.resolve()
// 一个标志代表是否正在刷新队列
let isFlushing = false
function flushJob() {
    if (isFlushing) return
    isFlushing = true
    p.then(() => {
        jobQueue.forEach(job => job())
    }).finally(() => {
        // 结束后重置
        isFlushing = false
    })
}
effect(() => {
    console.log(obj.num)
}, {
    scheduler(fn) {
        jobQueue.add(fn)
        flushJob()
    }
})

obj.num++
obj.num++

console.log('结束了')