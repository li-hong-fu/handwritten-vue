// 依赖收集,统一通知执行依赖中的各个更新函数
class Dep {
    // 为vue.$data中的每个key创建一个依赖数组
    constructor() {
        this.deps = new Set()
    }

    // 为Vue.$data中的每个key依赖数组deps追加对应的watcher
    // 追加时机，响应式对象get()方法中，即在对Vue.$data做响应式处理时defineReactive方法的get()中收集依赖
    addDep(watcher) {
        this.deps.add(watcher);
    }

    // 当响应式数据更新时，进行统一通知更新依赖
    notify() {
        this.deps.forEach(watcher => watcher.update())
    }
}

module.exports = Dep;