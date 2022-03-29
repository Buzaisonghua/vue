const data = {
    text: 'hello word'
}

// 存储副作用函数的桶
const bucket = new WeakMap()


const obj = new Proxy(data, {
    // 拦截读取操作
    get(target, key) {
        // 没有activeEffect,直接return
        if(!activeEffect) return target[key]
        let depsMap = bucket.get(target)
        if (!depsMap) {
            bucket.set(target, (depsMap = new Map()))
        }
        // 再根据key从depsMap中获取deps,它是一个set结构
        // 里面存储着所有与当前key相关的副作用函数：effects
        let deps = depsMap.get(key)
        // 如果deps不存在，同样新建一个Set并与key关联
        if (!deps) {
            depsMap.set(key, deps => new Set())
        }
        deps.add(activeEffect)

        return target[key]
    },

    // 拦截设置操作
    set(target, key, value) {
        target[key] = value
        const depsMap = bucket.get(target)
        if (!depsMap) return
        const deps = depsMap.get(key)
        deps && deps.forEach(fn => fn())
    }
})


