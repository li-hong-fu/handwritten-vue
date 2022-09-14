const Dep = require('./Dep');

// 监听器，负责以来更新
class Watcher {
    // vm：vue实例
    // fn：vm组件实例对应的渲染更新方法
    constructor(vm, fn) {
        this.vm = vm;
        this.getter = fn;

        // 触发依赖收集和执行渲染函数
        this.get()
    }

    // 触发依赖收集和执行渲染函数
    get() {
        // 触发依赖收集
        Dep.target = this;
        // 执行渲染函数
        this.getter.call(this.vm);
        Dep.target = null;
    }

    update() {
        this.get()
    }
}

module.exports = Watcher;