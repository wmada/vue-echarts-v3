'use strict'

let ECHARTS_EVENTS = [
    'click',
    'dblclick',
    'mouseover',
    'mouseout',
    'mousedown',
    'mouseup',
    'globalout',
    'legendselectchanged',
    'legendselected',
    'legendunselected',
    'datazoom',
    'datarangeselected',
    'timelinechanged',
    'timelineplaychanged',
    'restore',
    'dataviewchanged',
    'magictypechanged',
    'geoselectchanged',
    'geoselected',
    'geounselected',
    'pieselectchanged',
    'pieselected',
    'pieunselected',
    'mapselectchanged',
    'mapselected',
    'mapunselected',
    'axisareaselected',
    'brush',
    'brushselected'
]

exports = module.exports = function wrapECharts (ECharts, Resize, Debounce) {
    return {
        name: 'IEcharts',
        props: {
            hold: {
                type: Boolean,
                required: false,
                default: false
            },
            className: {
                type: String,
                required: false,
                default: 'vue-echarts'
            },
            theme: {
                type: String,
                required: false
            },
            group: {
                type: String,
                required: false
            },
            option: {
                type: Object,
                required: true
            },
            initOpts: {
                type: Object,
                required: false
            },
            notMerge: {
                type: Boolean,
                required: false,
                default: false
            },
            lazyUpdate: {
                type: Boolean,
                required: false,
                default: false
            },
            loading: {
                type: Boolean,
                required: false,
                default: false
            },
            loadingOpts: {
                type: Object,
                required: false
            },
            resizable: {
                type: Boolean,
                required: false,
                default: false
            }
        },
        data: function data () {
            return {
                fnResize: null,
                insResize: null,
                instance: null,
                watches: {
                    loading: null,
                    option: null,
                    group: null
                }
            }
        },
        computed: {
            width: {
                cache: false,
                get: function get () {
                    return this.instance.getWidth()
                }
            },
            height: {
                cache: false,
                get: function get () {
                    return this.instance.getHeight()
                }
            },
            isDisposed: {
                cache: false,
                get: function get () {
                    return this.instance.isDisposed()
                }
            }
        },
        watch: {
            hold: function (hold) {
                debugger
                let that = this
                if (!hold && !that.instance) {
                    that.init()
                }
            },
            loading: {
                handler: function handler (loading) {
                    debugger
                    let that = this
                    that.ifLoading(loading)
                },
                deep: false
            },
            option: {
                handler: function handler (option) {
                    debugger
                    let that = this
                    if (!that.hold && that.instance) {
                        that.instance.setOption(option, that.notMerge, that.lazyUpdate)
                    }
                },
                deep: true
            },
            group: {
                handler: function handler (group) {
                    debugger
                    let that = this
                    if (!that.hold && that.instance) {
                        that.instance.group = group
                    }
                },
                deep: false
            }
        },
        methods: {
            initResize: function initResize (dom) {
                let that = this
                if (that.resizable && typeof Resize === 'function') {
                    // Resize(dom, that.resize);
                    that.insResize = that.insResize || Resize({
                        strategy: 'scroll' // <- For ultra performance.
                    })
                    that.fnResize = that.fnResize || Debounce(that.resize, 250, {
                        'leading': true,
                        'trailing': true
                    })
                    that.insResize.listenTo(dom, function (element) {
                        // that.resize();
                        that.fnResize()
                    })
                }
            },
            init: function init () {
                let that = this
                if (!that.instance) {
                    let dom = that.$el
                    let instance = ECharts.getInstanceByDom(dom)
                    if (!instance) {
                        instance = ECharts.init(dom, that.theme, that.initOpts)
                    }
                    instance.group = that.group
                    that.instance = instance
                    that.$emit('ready', instance, ECharts)
                    that.$nextTick(function () {
                        that.ifLoading(that.loading)
                        that.update()
                        // that.watch();
                        that.bind()
                        that.initResize(dom)
                    })
                }
            },
            bind: function bind () {
                let that = this
                let _on = function _on (name) {
                    that.instance.on(name, function (event) {
                        that.$emit(name, event, that.instance, ECharts)
                    })
                }

                if (that._events) {
                    for (let e in that._events) {
                        if (Object.prototype.hasOwnProperty.call(that._events, e)) {
                            let name = e.toLowerCase()
                            if (ECHARTS_EVENTS.indexOf(name) > -1) {
                                _on(name)
                            }
                        }
                    }
                } else {
                    for (let i = 0, len = ECHARTS_EVENTS.length; i < len; i++) {
                        _on(ECHARTS_EVENTS[i])
                    }
                }
            },
            unbind: function unbind () {
                let that = this
                if (that._events) {
                    for (let e in that._events) {
                        if (Object.prototype.hasOwnProperty.call(that._events, e)) {
                            let name = e.toLowerCase()
                            if (ECHARTS_EVENTS.indexOf(name) > -1) {
                                that.instance.off(name)
                            }
                        }
                    }
                } else {
                    for (let i = 0, len = ECHARTS_EVENTS.length; i < len; i++) {
                        that.instance.off(ECHARTS_EVENTS[i])
                    }
                }
            },
            ifLoading: function ifLoading (loading) {
                let that = this
                if (loading) {
                    that.showLoading()
                } else {
                    that.hideLoading()
                }
            },
            watch: function watch () {
                let that = this
                that.watches.loading = that.$watch('loading', function (loading) {
                    that.ifLoading(loading)
                })
                that.watches.option = that.$watch('option', function (option) {
                    that.instance.setOption(option, that.notMerge, that.lazyUpdate)
                }, {
                    deep: true
                })
                that.watches.group = that.$watch('group', function (group) {
                    that.instance.group = group
                })
            },
            unwatch: function unwatch () {
                let that = this
                if (that.watches.loading) {
                    that.watches.loading()
                    that.watches.loading = null
                }
                if (that.watches.option) {
                    that.watches.option()
                    that.watches.option = null
                }
                if (that.watches.group) {
                    that.watches.group()
                    that.watches.group = null
                }
            },
            resize: function resize (opts) {
                let that = this
                if (that.instance) {
                    that.instance.resize(opts)
                }
            },
            update: function update () {
                let that = this
                if (that.instance) {
                    that.instance.setOption(that.option, that.notMerge, that.lazyUpdate)
                    that.resize()
                }
            },
            mergeOption: function mergeOption (opts) {
                let that = this
                if (that.instance) {
                    that.instance.setOption(opts, false, that.lazyUpdate)
                    that.resize()
                }
            },
            dispatchAction: function dispatchAction (payload) {
                let that = this
                if (that.instance) {
                    that.instance.dispatchAction(payload)
                }
            },
            convertToPixel: function convertToPixel (finder, value) {
                let that = this
                return that.instance.convertToPixel(finder, value)
            },
            convertFromPixel: function convertFromPixel (finder, value) {
                let that = this
                return that.instance.convertFromPixel(finder, value)
            },
            containPixel: function containPixel (finder, value) {
                let that = this
                return that.instance.containPixel(finder, value)
            },
            showLoading: function showLoading () {
                let that = this
                if (that.instance) {
                    that.instance.showLoading('default', that.loadingOpts)
                }
            },
            hideLoading: function hideLoading () {
                let that = this
                if (that.instance) {
                    that.instance.hideLoading()
                }
            },
            getDataURL: function getDataURL (opts) {
                let that = this
                return that.instance.getDataURL(opts)
            },
            getConnectedDataURL: function getConnectedDataURL (opts) {
                let that = this
                return that.instance.getConnectedDataURL(opts)
            },
            clear: function clear () {
                let that = this
                if (that.instance) {
                    that.instance.clear()
                }
            },
            uninitResize: function uninitResize () {
                let that = this
                if (that.insResize && that.insResize.uninstall) {
                    that.insResize.uninstall(that.$el)
                    that.insResize = null
                }
                if (that.fnResize && that.fnResize.cancel) {
                    that.fnResize.cancel()
                    that.fnResize = null
                }
            },
            uninit: function uninit () {
                let that = this
                if (that.instance) {
                    that.unbind()
                    // that.unwatch();
                    that.uninitResize()
                    that.instance.dispose()
                    that.instance = null
                }
            }
        },
        // beforeCreate: function beforeCreate() {
        // let that = this;
        // console.log('beforeCreate');
        // },
        // created: function created() {
        // let that = this;
        // console.log('created');
        // },
        // beforeMount: function beforeMount() {
        // let that = this;
        // console.log('beforeMount');
        // },
        mounted: function mounted () {
            let that = this
            // console.log('mounted');
            if (!that.hold) {
                that.init()
            }
        },
        // beforeUpdate: function beforeUpdate() {
        // let that = this;
        // console.log('beforeUpdate');
        // },
        // updated: function updated() {
        // let that = this;
        // console.log('updated');
        // },
        // activated: function activated() {
        // let that = this;
        // console.log('activated');
        // },
        // deactivated: function deactivated() {
        // let that = this;
        // console.log('deactivated');
        // },
        beforeDestroy: function beforeDestroy () {
            let that = this
            // console.log('beforeDestroy');
            that.uninit()
        },
        // destroyed: function destroyed() {
        // let that = this;
        // console.log('destroyed');
        // },
        connect: function connect (group) {
            return ECharts.connect(group)
        },
        disConnect: function disConnect (group) {
            return ECharts.disConnect(group)
        },
        dispose: function dispose (target) {
            return ECharts.dispose(target)
        },
        getInstanceByDom: function getInstanceByDom (target) {
            return ECharts.getInstanceByDom(target)
        },
        registerMap: function registerMap (mapName, geoJson, specialAreas) {
            return ECharts.registerMap(mapName, geoJson, specialAreas)
        },
        getMap: function getMap (mapName) {
            return ECharts.getMap(mapName)
        },
        registerTheme: function registerTheme (themeName, theme) {
            return ECharts.registerTheme(themeName, theme)
        }
    }
}
