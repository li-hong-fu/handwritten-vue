const Watcher = require('./watcher');
const { defineReactive, observe, set, proxy, Observer } = require('./Observer');

class Vue {
    constructor(options) {
        this.$options = options;
        this.$data = options.data;
        // $data做响应式处理
        observe(this.$data)

        // 代理，作用：使用户能直接通过vm实例访问到data里的数据，即this.xxx。否则需this.$data.xxx
        proxy(this)

        if (options.el) {
            this.$mount(options.el)
        }
    }

    $mount(el) {
        // 获取根节点元素
        this.$el = document.querySelector(el);
        // 组件的渲染函数
        const updateComponent = () => {
            // 从选项options中取得render函数
            const { render } = this.$options;
            // render()方法的作用是获取虚拟dom，$createElement方法是render()中参数h
            const vnode = render.call(this, this.$createElement);
            // 把vnode转换真实dom
            this._update(vnode)
        }

        // 为每个组件实例创建一个Watcher
        new Watcher(this, updateComponent)
    }

    // 这个就是我们render()中的参数h
    // 参数：tag标签;props标签属性,可为空;children子节点,也可能是文本标签
    // 注意：元素的childrenNodes与text互斥，即文本标签不可能存在子节点
    $createElement(tag, props, children) {
        return { tag, props, children }
    }

    _update(vnode) {
        // 获取上一次的vnode树
        const prevVnode = this._vnode;
        // 若老节点不存在，则初始化，否则更新
        if (!prevVnode) {
            // 初始化
            this._patch_(this.$el, vnode)
        } else {
            // 更新
            this._patch_(prevVnode, vnode)
        }
    }

    _patch_(oldVnode, vnode) {
        // 判断oldVnode是否真实dom
        // 是则将vnode转化为真实dom，添加到根节点
        // 否则遍历判断新老两棵vnode树，做增删改操作
        if (oldVnode.nodeType) { // 真实dom，初始化操作
            // 获取根元素的父节点，即body
            const parent = oldVnode.parentNode;
            // 获取根元素的上下节点
            const refElm = oldVnode.nextSibling;
            // 递归创建子节点
            const el = this.createElm(vnode);
            // 在body下，根节点旁插入el
            parent.insertBefore(el, refElm);
            // 删除之前的跟节点
            parent.removeChild(oldVnode);

            // 保存vnode，用于下次更新
            this._vnode = vnode;
        } else { // 更新操作
            // 获取vnode对应的真实dom，用于做真实dom操作
            const el = vnode.el = oldVnode.el;
            // 判断是否为同一个元素
            if (oldVnode.tag === vnode.tag) {
                // props属性更新
                this.propsOps(el, oldVnode, vnode);

                // children更新
                // 获取新老节点的children
                const oldCh = oldVnode.children;
                const newCh = vnode.children;
                // 若新节点为文本
                if (typeof newCh === 'string') {
                    // 若老节点也为文本
                    if (typeof oldCh === 'string') {
                        // 若新老节点文本内容不一致，则文本内容替换为新文本内容
                        if (newCh !== oldCh) {
                            el.textContent = newCh
                        }
                    } else { // 若老节点有子节点
                        el.textContent = newCh
                    }
                } else { // 若新节点有子节点
                    // 若老节点唔子节点，为文本，则清空文本后创建并新增子节点
                    if (typeof oldCh === 'string') {
                        el.textContent = '';
                        newCh.forEach(children => this.createElm(children));
                    } else { // 若老节点也有子节点，则检查更新
                        this.updateChildren(el, oldCh, newCh);
                    }
                }
            }

        }
    }

    // 创建节点元素
    createElm(vnode) {
        // 创建一个真实dom
        const el = document.createElement(vnode.tag);
        // 若存在props属性，则处理
        if (vnode.props) {
            // 遍历设置元素attribute属性
            for (const key in vnode.props) {
                el.setAttribute(key, vnode.props[key])
            }
        }

        // 若存在children,则处理
        if (vnode.children) {
            // 判断children类型
            if (typeof vnode.children === 'string') {
                // 该节点为文本
                el.textContent = vnode.children
            } else {
                // 该节点有节点
                // 递归遍历创建子节点，追加到元素下
                vnode.children.forEach(v => {
                    const child = this.createElm(v);
                    el.appendChild(child)
                })
            }
        }

        // 保存真实dom，用于diff算法做真实dom操作
        vnode.el = el;

        return el;
    }

    // 节点的props属性操作方法
    propsOps(el, oldVnode, newVnode) {
        // 获取新老节点的属性列表
        const oldProps = oldVnode.props || {};
        const newProps = newVnode.props || {};

        // 遍历新属性列表
        for (const key in newProps) {
            // 若老节点中不存在新节点的属性，则删除该属性
            if (!(key in oldProps)) {
                el.removeAttribute(key)
            } else {
                // 否则更新新属性内容
                const oldValue = oldProps[key];
                const newValue = newProps[key];
                if (oldValue !== newValue) {
                    el.setAttribute(key, newValue)
                }
            }
        }
    }

    // 更新子节点
    updateChildren(parentElm, oldCh, newCh) {
        // 获取新老节点树的最小长度
        const len = Math.min(oldCh.length, newCh.length);

        // 根据最小长度len遍历做节点更新
        for (let i = 0; i < len; i++) {
            this._patch_(oldCh[i], newCh[i])
        }

        // 判断新老节点数的长度，做新增或删除操作
        // 若老节点数长度大于新节点树长度，则删除多余节点，反之则新增节点
        if (oldCh.length > newCh.length) {
            oldCh.slice(len).forEach(child => {
                const el = this.createElm(child);
                parentElm.removeChild(el);
            })
        } else if (newCh.length > oldCh.length) {
            newCh.slice(len).forEach(child => {
                const el = this.createElm(child);
                parentElm.appendChild(el)
            })
        }
    }
}

module.exports = Vue;