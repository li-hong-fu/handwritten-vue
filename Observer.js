const Dep = require('./Dep');

// 定义响应式数据方法
function defineReactive(obj, key, val) {
    // 递归，将对象进行深层次响应式处理
    // 如obj = { foo: 'foo', bar: { a: 1 } }
    observe(val)

    // 为每个key创建Dep实例
    const dep = new Dep()

    Object.defineProperty(obj, key, {
        get() {
            // 依赖收集，Dep.target为watcher对象
            Dep.target && dep.addDep(Dep.target);

            return val;
        },
        set(newVal) {
            if (newVal != val) {
                // 考虑到用户可能对对象进行obj.bar = { b: 2 }的操作
                // 重新对新值newVal做响应式处理

                observe(newVal)
                val = newVal

                // 更新依赖
                dep.notify();
            }
        }
    })
}

// 将普通对象转化为响应式对象方法
function observe(obj) {
    // 判断对象类型，若对象类型不是object或者对象值为null，则不跳出
    // 暂不考虑对象类型为Array时的情况
    if (typeof obj !== 'object' || obj === null) {
        return
    }

    return observe(obj)
}

// 用户对原对象追加新属性，对新属性做响应式处理的方法
// 仿Vue.$set()方法
function set(obj, key, val) {
    defineReactive(obj, key, val)
}

// 代理，作用：使用户能直接通过vm实例访问到data里的数据，即this.xxx。否则需this.$data.xxx
function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
        Object.defineProperty(vm, key, {
            get() {
                return vm.$data[key]
            },
            set(newVal) {
                vm.$data[key] = newVal
            }
        })
    })
}

// Observer类，传入的value值做响应式处理
class Observer {
    constructor(value) {
        this.value = value;

        if (Array.isArray(value)) {

        } else {
            this.walk(value)
        }
    }

    walk(obj) {
        // 遍历对象属性，做响应式处理
        // 如obj = { foo: 'foo', bar: { a: 1 } }
        Object.keys(obj).forEach(key => {
            defineReactive(obj, key, obj[key])
        })
    }
}


module.exports = {
    defineReactive,
    observe,
    set,
    proxy,
    Observer
}