(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.PriceEstimate = factory());
})(this, (function () { 'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const durationUnitRegex = /[a-zA-Z]/;
    const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);
    // export const characterRange = (startChar, endChar) =>
    //   String.fromCharCode(
    //     ...range(
    //       endChar.charCodeAt(0) - startChar.charCodeAt(0),
    //       startChar.charCodeAt(0)
    //     )
    //   );
    // export const zip = (arr, ...arrs) =>
    //   arr.map((val, i) => arrs.reduce((list, curr) => [...list, curr[i]], [val]));

    /* node_modules\svelte-loading-spinners\dist\Jumper.svelte generated by Svelte v3.44.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (44:2) {#each range(3, 1) as version}
    function create_each_block$2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "circle svelte-1cy66mt");
    			set_style(div, "animation-delay", /*durationNum*/ ctx[5] / 3 * (/*version*/ ctx[6] - 1) + /*durationUnit*/ ctx[4]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let div;
    	let each_value = range(3, 1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "wrapper svelte-1cy66mt");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*durationNum, range, durationUnit*/ 48) {
    				each_value = range(3, 1);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1s" } = $$props;
    	let { size = "60" } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    	};

    	return [color, unit, duration, size, durationUnit, durationNum];
    }

    class Jumper extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { color: 0, unit: 1, duration: 2, size: 3 });
    	}
    }

    /* src\components\Number.svelte generated by Svelte v3.44.0 */

    function create_fragment$3(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*formattedNumber*/ ctx[0]);
    			attr(span, "class", "svelte-l7dsqe");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*formattedNumber*/ 1) set_data(t, /*formattedNumber*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let formattedNumber;
    	let { number } = $$props;
    	let { locale = "en" } = $$props;

    	$$self.$$set = $$props => {
    		if ('number' in $$props) $$invalidate(1, number = $$props.number);
    		if ('locale' in $$props) $$invalidate(2, locale = $$props.locale);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*number, locale*/ 6) {
    			/*
    	const testLocales = [
    		"en",
    		"ko-KR",
    		"de-DE",
    		"ru-RU",
    		"zh-CN"
    	];
    */
    			$$invalidate(0, formattedNumber = number.toLocaleString(locale, {})); /*notation: "compact",
    compactDisplay: "short"*/
    		}
    	};

    	return [formattedNumber, number, locale];
    }

    class Number extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { number: 1, locale: 2 });
    	}
    }

    function emailValidator () {
        return function email (value) {
          return (value && !!value.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) || 'Please enter a valid email'
        }
      }
      
      function requiredValidator () {
        return function required (value) {
          return (value !== undefined && value !== null && value !== '') || 'This field is required'
        }
      }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function buildValidator (validators) {
        return function validate (value, dirty) {
          if (!validators || validators.length === 0) {
            return { dirty, valid: true }
          }
      
          const failing = validators.find(v => v(value) !== true);
      
          return {
            dirty,
            valid: !failing,
            message: failing && failing(value)
          }
        }
      }

    function createFieldValidator (...validators) {
      const { subscribe, set } = writable({ dirty: false, valid: false, message: null });
      const validator = buildValidator(validators);

      function action (node, binding) {
        function validate (value, dirty) {
          const result = validator(value, dirty);
          set(result);
        }
        
        validate(binding, false);

        return {
          update (value) {
            validate(value, true);
          }
        }
      }

      function reset() {
        setTimeout(() => {
          set({ dirty: false, valid: false, message: null });
        }, 500);
      }

      return [ { subscribe }, action, reset ]
    }

    /* src\Summary.svelte generated by Svelte v3.44.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (108:4) {#each estimate.item.options as option}
    function create_each_block_1$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*option*/ ctx[20].description + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*option*/ ctx[20].category_name + "";
    	let t2;

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			attr(td0, "class", "svelte-lhb2gh");
    			attr(td1, "class", "svelte-lhb2gh");
    			attr(tr, "class", "svelte-lhb2gh");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			append(td1, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*estimates*/ 8 && t0_value !== (t0_value = /*option*/ ctx[20].description + "")) set_data(t0, t0_value);
    			if (dirty & /*estimates*/ 8 && t2_value !== (t2_value = /*option*/ ctx[20].category_name + "")) set_data(t2, t2_value);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (98:2) {#each estimates as estimate, i}
    function create_each_block$1(ctx) {
    	let div;
    	let table;
    	let th0;
    	let t0_value = /*estimate*/ ctx[17].item.title + "";
    	let t0;
    	let t1;
    	let t2_value = /*estimate*/ ctx[17].quantity + "";
    	let t2;
    	let t3_value = /*estimate*/ ctx[17].item.measure + "";
    	let t3;
    	let t4;
    	let t5;
    	let th1;
    	let button;
    	let t7;
    	let t8;
    	let tr;
    	let td0;
    	let t10;
    	let td1;
    	let number;
    	let t11;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*i*/ ctx[19]);
    	}

    	let each_value_1 = /*estimate*/ ctx[17].item.options;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	number = new Number({
    			props: {
    				number: /*estimate*/ ctx[17].item.total,
    				locale: "en"
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			table = element("table");
    			th0 = element("th");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(t3_value);
    			t4 = text(")");
    			t5 = space();
    			th1 = element("th");
    			button = element("button");
    			button.innerHTML = `<span aria-hidden="true">×</span>`;
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			tr = element("tr");
    			td0 = element("td");
    			td0.innerHTML = `<b>Total</b>`;
    			t10 = space();
    			td1 = element("td");
    			create_component(number.$$.fragment);
    			t11 = text(" €");
    			attr(button, "type", "button");
    			attr(button, "class", "close svelte-lhb2gh");
    			attr(button, "data-dismiss", "alert");
    			attr(button, "aria-label", "Close");
    			set_style(th1, "text-align", "right");
    			attr(td0, "class", "svelte-lhb2gh");
    			attr(td1, "class", "svelte-lhb2gh");
    			attr(tr, "class", "svelte-lhb2gh");
    			attr(table, "class", "svelte-lhb2gh");
    			attr(div, "class", "estimate-item svelte-lhb2gh");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, table);
    			append(table, th0);
    			append(th0, t0);
    			append(th0, t1);
    			append(th0, t2);
    			append(th0, t3);
    			append(th0, t4);
    			append(table, t5);
    			append(table, th1);
    			append(th1, button);
    			append(table, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			append(table, t8);
    			append(table, tr);
    			append(tr, td0);
    			append(tr, t10);
    			append(tr, td1);
    			mount_component(number, td1, null);
    			append(td1, t11);
    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*estimates*/ 8) && t0_value !== (t0_value = /*estimate*/ ctx[17].item.title + "")) set_data(t0, t0_value);
    			if ((!current || dirty & /*estimates*/ 8) && t2_value !== (t2_value = /*estimate*/ ctx[17].quantity + "")) set_data(t2, t2_value);
    			if ((!current || dirty & /*estimates*/ 8) && t3_value !== (t3_value = /*estimate*/ ctx[17].item.measure + "")) set_data(t3, t3_value);

    			if (dirty & /*estimates*/ 8) {
    				each_value_1 = /*estimate*/ ctx[17].item.options;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, t8);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			const number_changes = {};
    			if (dirty & /*estimates*/ 8) number_changes.number = /*estimate*/ ctx[17].item.total;
    			number.$set(number_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(number.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(number.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    			destroy_component(number);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (123:2) {#if (estimates.length == 0)}
    function create_if_block_2$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Aun no hay items agregados al estimado";
    			attr(div, "class", "no-items-text svelte-lhb2gh");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (134:2) {#if (estimates.length > 0)}
    function create_if_block_1$1(ctx) {
    	let br;
    	let t0;
    	let div4;
    	let div3;
    	let div0;
    	let input;
    	let validate_action;
    	let t1;
    	let div2;
    	let div1;
    	let button;
    	let t2;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			br = element("br");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button = element("button");
    			t2 = text("Enviar");
    			attr(input, "type", "email");
    			attr(input, "class", "form-control");
    			attr(input, "placeholder", "Correo electrónico");
    			attr(div0, "class", "col-md-8 col-12");
    			attr(button, "type", "button");
    			attr(button, "class", "btn btn-success generate svelte-lhb2gh");
    			button.disabled = button_disabled_value = !/*$validity*/ ctx[5].valid;
    			attr(div1, "class", "d-flex flex-row-reverse");
    			attr(div2, "class", "col-md-4 col-12");
    			attr(div3, "class", "row");
    			attr(div4, "class", "container");
    		},
    		m(target, anchor) {
    			insert(target, br, anchor);
    			insert(target, t0, anchor);
    			insert(target, div4, anchor);
    			append(div4, div3);
    			append(div3, div0);
    			append(div0, input);
    			set_input_value(input, /*email*/ ctx[0]);
    			append(div3, t1);
    			append(div3, div2);
    			append(div2, div1);
    			append(div1, button);
    			append(button, t2);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(validate_action = /*validate*/ ctx[7].call(null, input, /*email*/ ctx[0])),
    					listen(input, "input", /*input_input_handler*/ ctx[12]),
    					listen(button, "click", /*click_handler_1*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (validate_action && is_function(validate_action.update) && dirty & /*email*/ 1) validate_action.update.call(null, /*email*/ ctx[0]);

    			if (dirty & /*email*/ 1 && input.value !== /*email*/ ctx[0]) {
    				set_input_value(input, /*email*/ ctx[0]);
    			}

    			if (dirty & /*$validity*/ 32 && button_disabled_value !== (button_disabled_value = !/*$validity*/ ctx[5].valid)) {
    				button.disabled = button_disabled_value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(br);
    			if (detaching) detach(t0);
    			if (detaching) detach(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (160:1) {#if (isLoading)}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let jumper;
    	let current;

    	jumper = new Jumper({
    			props: {
    				size: "60",
    				color: "#0d6efd",
    				unit: "px",
    				duration: "1s",
    				class: "align-self-center"
    			}
    		});

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(jumper.$$.fragment);
    			attr(div0, "class", "svelte-lhb2gh");
    			attr(div1, "class", "loader svelte-lhb2gh");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			mount_component(jumper, div0, null);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(jumper.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(jumper.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_component(jumper);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h10;
    	let t1;
    	let div3;
    	let t2;
    	let t3;
    	let div2;
    	let div1;
    	let div0;
    	let t5;
    	let h11;
    	let number;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let t10_value = /*messageSentResult*/ ctx[1].message + "";
    	let t10;
    	let t11;
    	let button;
    	let div6_class_value;
    	let current;
    	let each_value = /*estimates*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block0 = /*estimates*/ ctx[3].length == 0 && create_if_block_2$1();

    	number = new Number({
    			props: { number: /*total*/ ctx[4], locale: "en" }
    		});

    	let if_block1 = /*estimates*/ ctx[3].length > 0 && create_if_block_1$1(ctx);
    	let if_block2 = /*isLoading*/ ctx[2] && create_if_block$1();

    	return {
    		c() {
    			main = element("main");
    			h10 = element("h1");
    			h10.textContent = "Estimado";
    			t1 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Total estimado";
    			t5 = space();
    			h11 = element("h1");
    			create_component(number.$$.fragment);
    			t6 = text(" €");
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			t9 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			t10 = text(t10_value);
    			t11 = space();
    			button = element("button");
    			attr(h10, "class", "svelte-lhb2gh");
    			attr(h11, "class", "svelte-lhb2gh");
    			attr(div1, "class", "estimate-total shadow-sm p-3 svelte-lhb2gh");
    			attr(div2, "class", "d-flex justify-content-center");
    			attr(div3, "class", "estimate-container");
    			attr(div4, "class", "toast-body");
    			attr(button, "type", "button");
    			attr(button, "class", "btn-close btn-close-white me-2 m-auto");
    			attr(button, "data-bs-dismiss", "toast");
    			attr(button, "aria-label", "Close");
    			attr(div5, "class", "d-flex");
    			attr(div6, "id", "liveToast");

    			attr(div6, "class", div6_class_value = "toast align-items-center text-white bg-" + (/*messageSentResult*/ ctx[1].status
    			? 'success'
    			: 'danger') + " border-0");

    			attr(div6, "role", "alert");
    			attr(div6, "aria-live", "assertive");
    			attr(div6, "aria-atomic", "true");
    			attr(div7, "class", "position-fixed bottom-0 end-0 p-3");
    			set_style(div7, "z-index", "11");
    			attr(main, "id", "estimateContent");
    			attr(main, "class", "svelte-lhb2gh");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, h10);
    			append(main, t1);
    			append(main, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append(div3, t2);
    			if (if_block0) if_block0.m(div3, null);
    			append(div3, t3);
    			append(div3, div2);
    			append(div2, div1);
    			append(div1, div0);
    			append(div1, t5);
    			append(div1, h11);
    			mount_component(number, h11, null);
    			append(h11, t6);
    			append(div3, t7);
    			if (if_block1) if_block1.m(div3, null);
    			append(main, t8);
    			if (if_block2) if_block2.m(main, null);
    			append(main, t9);
    			append(main, div7);
    			append(div7, div6);
    			append(div6, div5);
    			append(div5, div4);
    			append(div4, t10);
    			append(div5, t11);
    			append(div5, button);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*estimates, removeItem*/ 264) {
    				each_value = /*estimates*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, t2);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*estimates*/ ctx[3].length == 0) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$1();
    					if_block0.c();
    					if_block0.m(div3, t3);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const number_changes = {};
    			if (dirty & /*total*/ 16) number_changes.number = /*total*/ ctx[4];
    			number.$set(number_changes);

    			if (/*estimates*/ ctx[3].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*isLoading*/ ctx[2]) {
    				if (if_block2) {
    					if (dirty & /*isLoading*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$1();
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t9);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*messageSentResult*/ 2) && t10_value !== (t10_value = /*messageSentResult*/ ctx[1].message + "")) set_data(t10, t10_value);

    			if (!current || dirty & /*messageSentResult*/ 2 && div6_class_value !== (div6_class_value = "toast align-items-center text-white bg-" + (/*messageSentResult*/ ctx[1].status
    			? 'success'
    			: 'danger') + " border-0")) {
    				attr(div6, "class", div6_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(number.$$.fragment, local);
    			transition_in(if_block2);
    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(number.$$.fragment, local);
    			transition_out(if_block2);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			destroy_component(number);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};
    }

    const MAIL_URL = "your mail url to send estimate data";

    function instance$2($$self, $$props, $$invalidate) {
    	let estimates;
    	let total;
    	let isLoading;
    	let messageSentResult;
    	let $validity;
    	const [validity, validate, resetValidation] = createFieldValidator(requiredValidator(), emailValidator());
    	component_subscribe($$self, validity, value => $$invalidate(5, $validity = value));
    	let email;

    	const addToEstimate = estimate => {
    		$$invalidate(4, total += estimate.item.total);
    		$$invalidate(3, estimates = [...estimates, estimate]);
    	};

    	function removeItem(i) {
    		$$invalidate(4, total -= estimates[i].item.total);
    		estimates.splice(i, 1);
    		$$invalidate(3, estimates);
    	}

    	async function generate() {
    		$$invalidate(2, isLoading = true);
    		let mailData = { total, items: [] };

    		for (var i in estimates) {
    			let estimate = estimates[i];
    			var options = [];

    			for (var k in estimate.item.options) {
    				let option = estimate.item.options[k];

    				options.push({
    					description: option.description,
    					category: option.category_name
    				});
    			}

    			mailData.items.push({
    				options,
    				title: estimate.item.title,
    				total: estimate.item.total,
    				quantity: estimate.quantity,
    				measure: estimate.item.measure
    			});
    		}

    		const res = await fetch(MAIL_URL, {
    			method: "POST",
    			body: JSON.stringify({ data: mailData, email })
    		}).catch(error => {
    			console.log(error);
    			$$invalidate(2, isLoading = false);
    			showError();
    		});

    		$$invalidate(2, isLoading = false);
    		const json = await res.json();

    		if (json.status) {
    			showSuccess();
    		} else {
    			showError();
    		}
    	}

    	function showSuccess() {
    		$$invalidate(1, messageSentResult.message = 'Mensaje enviado, te contactaremos pronto', messageSentResult);
    		$$invalidate(1, messageSentResult.status = true, messageSentResult);
    		var toastLiveExample = document.getElementById('liveToast');
    		var toast = new bootstrap.Toast(toastLiveExample);
    		toast.show();
    	}

    	function showError() {
    		$$invalidate(1, messageSentResult.message = 'Ha ocurrido un error al enviar, intentelo mas tarde', messageSentResult);
    		$$invalidate(1, messageSentResult.status = false, messageSentResult);
    		var toastLiveExample = document.getElementById('liveToast');
    		var toast = new bootstrap.Toast(toastLiveExample);
    		toast.show();
    	}

    	const click_handler = i => removeItem(i);

    	function input_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	const click_handler_1 = () => generate();
    	$$invalidate(3, estimates = []);
    	$$invalidate(4, total = 0);
    	$$invalidate(2, isLoading = false);
    	$$invalidate(1, messageSentResult = { status: true, message: '' });

    	return [
    		email,
    		messageSentResult,
    		isLoading,
    		estimates,
    		total,
    		$validity,
    		validity,
    		validate,
    		removeItem,
    		generate,
    		addToEstimate,
    		click_handler,
    		input_input_handler,
    		click_handler_1
    	];
    }

    class Summary extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { addToEstimate: 10 });
    	}

    	get addToEstimate() {
    		return this.$$.ctx[10];
    	}
    }

    var sliderConfig = {
        infinite: false,
        slidesToShow: 7,
        slidesToScroll: 2,
        variableWidth:false,

        responsive: [
          {
            breakpoint: 2100,
            settings: {
              slidesToShow: 6,
              slidesToScroll: 2,
              infinite: false,
              dots: false
            }
          },
          {
            breakpoint: 1700,
            settings: {
              slidesToShow: 5,
              slidesToScroll: 2,
              infinite: false,
              dots: false
            }
          },
          {
            breakpoint: 1500,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 2,
              infinite: false,
              dots: false
            }
          },
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
              infinite: false,
              dots: false
            }
          },
          {
            breakpoint: 900,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
              infinite: false,
              dots: false
            }
          },
          
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 3,
              infinite: false,
              dots: false
            }
          },        
          {
            breakpoint: 600,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
              infinite: false,
              dots: false
            }
          },        
          {
            breakpoint: 436,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              infinite: false,
              dots: false
            }
          }
        ],
        prevArrow:'<button type="button" data-role="none" class="slick-prev"><i class="bi bi-chevron-left"></i></button>',
        nextArrow:'<button type="button" data-role="none" class="slick-next"><i class="bi bi-chevron-right"></i></button>'
      };

    /* src\ItemSelector.svelte generated by Svelte v3.44.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[16] = list;
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i][0];
    	child_ctx[19] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (104:2) {#if selected}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let div4;
    	let h3;
    	let t1_value = /*selected*/ ctx[3].title + "";
    	let t1;
    	let t2;
    	let div3;
    	let table;
    	let thead;
    	let t5;
    	let tbody;
    	let t6;
    	let br0;
    	let t7;
    	let br1;
    	let t8;
    	let t9;
    	let t10;
    	let div2;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*upgrades*/ ctx[4];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*selected*/ ctx[3].options;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = /*showErrors*/ ctx[0] && create_if_block_2();
    	let if_block1 = !/*selected*/ ctx[3].unique && create_if_block_1(ctx);

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div4 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			table = element("table");
    			thead = element("thead");

    			thead.innerHTML = `<tr class="svelte-1oapiqr"><th class="svelte-1oapiqr"></th> 
            <th class="svelte-1oapiqr">Calidad</th></tr>`;

    			t5 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			br0 = element("br");
    			t7 = space();
    			br1 = element("br");
    			t8 = space();
    			if (if_block0) if_block0.c();
    			t9 = space();
    			if (if_block1) if_block1.c();
    			t10 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Agregar";
    			attr(div0, "class", "slider upgrades-slider");
    			attr(div1, "id", "slider-container");
    			attr(table, "class", "h-100 w-100");
    			attr(button, "type", "button");
    			attr(button, "class", "btn btn-primary add-to-estimate svelte-1oapiqr");
    			attr(div3, "id", "form-container");
    			attr(div3, "class", "svelte-1oapiqr");
    			attr(div4, "id", "upgrade-content");
    			attr(div4, "class", "svelte-1oapiqr");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert(target, t0, anchor);
    			insert(target, div4, anchor);
    			append(div4, h3);
    			append(h3, t1);
    			append(div4, t2);
    			append(div4, div3);
    			append(div3, table);
    			append(table, thead);
    			append(table, t5);
    			append(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append(div3, t6);
    			append(div3, br0);
    			append(div3, t7);
    			append(div3, br1);
    			append(div3, t8);
    			if (if_block0) if_block0.m(div3, null);
    			append(div3, t9);
    			if (if_block1) if_block1.m(div3, null);
    			append(div3, t10);
    			append(div3, div2);
    			append(div2, button);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler_1*/ ctx[11]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*selectUpgrade, upgrades*/ 48) {
    				each_value_2 = /*upgrades*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*selected*/ 8 && t1_value !== (t1_value = /*selected*/ ctx[3].title + "")) set_data(t1, t1_value);

    			if (dirty & /*selected, Object*/ 8) {
    				each_value = /*selected*/ ctx[3].options;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*showErrors*/ ctx[0]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2();
    					if_block0.c();
    					if_block0.m(div3, t9);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!/*selected*/ ctx[3].unique) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div3, t10);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach(t0);
    			if (detaching) detach(div4);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (107:6) {#each upgrades as upgrade}
    function create_each_block_2(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let t1_value = /*upgrade*/ ctx[22].name + "";
    	let t1;
    	let div1_class_value;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*upgrade*/ ctx[22]);
    	}

    	return {
    		c() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			if (!src_url_equal(img.src, img_src_value = /*upgrade*/ ctx[22].icon)) attr(img, "src", img_src_value);
    			attr(img, "alt", img_alt_value = /*upgrade*/ ctx[22].name);
    			attr(img, "class", "svelte-1oapiqr");
    			attr(div0, "class", "svelte-1oapiqr");
    			attr(div1, "class", div1_class_value = "upgrade-element " + (/*upgrade*/ ctx[22].selected ? 'selected' : '') + " svelte-1oapiqr");
    			attr(div2, "class", "d-flex justify-content-center");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div1);
    			append(div1, img);
    			append(div1, t0);
    			append(div1, div0);
    			append(div0, t1);
    			append(div2, t2);

    			if (!mounted) {
    				dispose = listen(div2, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*upgrades*/ 16 && !src_url_equal(img.src, img_src_value = /*upgrade*/ ctx[22].icon)) {
    				attr(img, "src", img_src_value);
    			}

    			if (dirty & /*upgrades*/ 16 && img_alt_value !== (img_alt_value = /*upgrade*/ ctx[22].name)) {
    				attr(img, "alt", img_alt_value);
    			}

    			if (dirty & /*upgrades*/ 16 && t1_value !== (t1_value = /*upgrade*/ ctx[22].name + "")) set_data(t1, t1_value);

    			if (dirty & /*upgrades*/ 16 && div1_class_value !== (div1_class_value = "upgrade-element " + (/*upgrade*/ ctx[22].selected ? 'selected' : '') + " svelte-1oapiqr")) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (143:16) {#each Object.entries(option.category) as [type, price]}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[15].category[/*type*/ ctx[18]].label + "";
    	let t;
    	let option_value_value;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*type*/ ctx[18];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*selected*/ 8 && t_value !== (t_value = /*option*/ ctx[15].category[/*type*/ ctx[18]].label + "")) set_data(t, t_value);

    			if (dirty & /*selected, Object*/ 8 && option_value_value !== (option_value_value = /*type*/ ctx[18])) {
    				option.__value = option_value_value;
    				option.value = option.__value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    // (135:10) {#each selected.options as option}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*option*/ ctx[15].description + "";
    	let t0;
    	let t1;
    	let td1;
    	let select;
    	let t2;
    	let mounted;
    	let dispose;
    	let each_value_1 = Object.entries(/*option*/ ctx[15].category);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[9].call(select, /*each_value*/ ctx[16], /*option_index*/ ctx[17]);
    	}

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr(td0, "class", "svelte-1oapiqr");
    			attr(select, "class", "form-control svelte-1oapiqr");
    			if (/*option*/ ctx[15].selected === void 0) add_render_callback(select_change_handler);
    			attr(td1, "class", "svelte-1oapiqr");
    			attr(tr, "class", "svelte-1oapiqr");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			append(td1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*option*/ ctx[15].selected);
    			append(tr, t2);

    			if (!mounted) {
    				dispose = listen(select, "change", select_change_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*selected*/ 8 && t0_value !== (t0_value = /*option*/ ctx[15].description + "")) set_data(t0, t0_value);

    			if (dirty & /*Object, selected*/ 8) {
    				each_value_1 = Object.entries(/*option*/ ctx[15].category);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*selected, Object*/ 8) {
    				select_option(select, /*option*/ ctx[15].selected);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (154:6) {#if (showErrors)}
    function create_if_block_2(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<strong>¡Campo requerido!</strong> Es necesario ingresar la cantidad`;
    			attr(div, "class", "alert alert-danger alert-dismissible fade show");
    			attr(div, "role", "alert");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (159:6) {#if (!selected.unique)}
    function create_if_block_1(ctx) {
    	let div;
    	let label;
    	let t0_value = /*measure*/ ctx[2].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*measure*/ ctx[2].short_name + "";
    	let t2;
    	let t3;
    	let t4;
    	let input;
    	let input_placeholder_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			input = element("input");
    			attr(label, "for", "square-meters");
    			attr(input, "type", "number");
    			attr(input, "class", "form-control");
    			attr(input, "id", "square-meters");
    			attr(input, "placeholder", input_placeholder_value = /*measure*/ ctx[2].short_name);
    			attr(div, "class", "form-group");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, t0);
    			append(label, t1);
    			append(label, t2);
    			append(label, t3);
    			append(div, t4);
    			append(div, input);
    			set_input_value(input, /*quantity*/ ctx[1]);

    			if (!mounted) {
    				dispose = listen(input, "input", /*input_input_handler*/ ctx[10]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*measure*/ 4 && t0_value !== (t0_value = /*measure*/ ctx[2].name + "")) set_data(t0, t0_value);
    			if (dirty & /*measure*/ 4 && t2_value !== (t2_value = /*measure*/ ctx[2].short_name + "")) set_data(t2, t2_value);

    			if (dirty & /*measure*/ 4 && input_placeholder_value !== (input_placeholder_value = /*measure*/ ctx[2].short_name)) {
    				attr(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*quantity*/ 2 && to_number(input.value) !== /*quantity*/ ctx[1]) {
    				set_input_value(input, /*quantity*/ ctx[1]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let main;
    	let if_block = /*selected*/ ctx[3] && create_if_block(ctx);

    	return {
    		c() {
    			main = element("main");
    			if (if_block) if_block.c();
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    		},
    		p(ctx, [dirty]) {
    			if (/*selected*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(main);
    			if (if_block) if_block.d();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const jq = window.$;
    	const dispatch = createEventDispatcher();
    	let { data } = $$props;
    	let showErrors = false;
    	let quantity;
    	let measure;
    	var selected;
    	var upgrades = data;

    	onMount(async () => {
    		selectUpgrade(upgrades[0]);
    	});

    	jq(document).ready(function () {
    		jq('.upgrades-slider').slick(sliderConfig);
    	});

    	function unselectAllUpgrades() {
    		for (var i in upgrades) {
    			$$invalidate(4, upgrades[i].selected = false, upgrades);
    		}
    	}

    	function selectUpgrade(upgrade) {
    		unselectAllUpgrades();
    		upgrade.selected = true;
    		let _upgrade = JSON.parse(JSON.stringify(upgrade));

    		$$invalidate(2, measure = {
    			name: _upgrade.measure.name,
    			short_name: _upgrade.measure.short_name
    		});

    		$$invalidate(3, selected = {
    			title: _upgrade.title,
    			options: _upgrade.items,
    			unique: _upgrade.unique,
    			measure: measure.short_name
    		});
    	}

    	function addUpgradeToEstimate() {
    		var total = 0;

    		if (quantity || selected.unique) {
    			$$invalidate(0, showErrors = false);
    		} else {
    			$$invalidate(0, showErrors = true);
    			return;
    		}

    		for (var i in selected.options) {
    			let selectedOption = selected.options[i].selected;
    			let category = selected.options[i].category[selectedOption];
    			$$invalidate(3, selected.options[i].category_name = category.label, selected);

    			category.price_ranges.forEach(function (range) {
    				let currentMin = quantity - (range.from_quantity ?? 0);
    				let maxQuantity = Math.min(currentMin, range.to_quantity ?? currentMin);
    				if (currentMin < 0) return;

    				//console.log(`${maxQuantity} / ${range.step} * ${range.price}`);
    				if (range.step) {
    					total += Math.ceil(maxQuantity / range.step) * range.price;
    				} else {
    					total += range.price;
    				}
    			});
    		}

    		$$invalidate(3, selected.total = total, selected);
    		let item = JSON.parse(JSON.stringify(selected));

    		if (selected.unique) {
    			$$invalidate(1, quantity = 1);
    		}

    		dispatch('newEstimate', { item, quantity });

    		for (var i in upgrades) {
    			if (upgrades[i].selected) {
    				selectUpgrade(upgrades[i]);
    			}
    		}

    		$$invalidate(1, quantity = null);
    	}

    	const click_handler = upgrade => selectUpgrade(upgrade);

    	function select_change_handler(each_value, option_index) {
    		each_value[option_index].selected = select_value(this);
    		$$invalidate(3, selected);
    	}

    	function input_input_handler() {
    		quantity = to_number(this.value);
    		$$invalidate(1, quantity);
    	}

    	const click_handler_1 = () => addUpgradeToEstimate();

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(7, data = $$props.data);
    	};

    	return [
    		showErrors,
    		quantity,
    		measure,
    		selected,
    		upgrades,
    		selectUpgrade,
    		addUpgradeToEstimate,
    		data,
    		click_handler,
    		select_change_handler,
    		input_input_handler,
    		click_handler_1
    	];
    }

    class ItemSelector extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 7 });
    	}
    }

    /* src\PriceEstimate.svelte generated by Svelte v3.44.0 */

    function create_fragment(ctx) {
    	let main;
    	let div3;
    	let div2;
    	let div0;
    	let itemselector;
    	let t;
    	let div1;
    	let summary;
    	let current;
    	itemselector = new ItemSelector({ props: { data: /*data*/ ctx[0] } });
    	itemselector.$on("newEstimate", /*whenNewEstimate*/ ctx[2]);
    	let summary_props = {};
    	summary = new Summary({ props: summary_props });
    	/*summary_binding*/ ctx[3](summary);

    	return {
    		c() {
    			main = element("main");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(itemselector.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(summary.$$.fragment);
    			attr(div0, "class", "col-md-6 col-12");
    			attr(div1, "class", "col-md-6 col-12");
    			attr(div2, "class", "row");
    			attr(div3, "class", "container svelte-1g3wl12");
    			attr(main, "class", "h-100 svelte-1g3wl12");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div3);
    			append(div3, div2);
    			append(div2, div0);
    			mount_component(itemselector, div0, null);
    			append(div2, t);
    			append(div2, div1);
    			mount_component(summary, div1, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const itemselector_changes = {};
    			if (dirty & /*data*/ 1) itemselector_changes.data = /*data*/ ctx[0];
    			itemselector.$set(itemselector_changes);
    			const summary_changes = {};
    			summary.$set(summary_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(itemselector.$$.fragment, local);
    			transition_in(summary.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(itemselector.$$.fragment, local);
    			transition_out(summary.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(itemselector);
    			/*summary_binding*/ ctx[3](null);
    			destroy_component(summary);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let estimate;
    	let { data } = $$props;
    	const whenNewEstimate = event => estimate.addToEstimate(event.detail);

    	function summary_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			estimate = $$value;
    			$$invalidate(1, estimate);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data, estimate, whenNewEstimate, summary_binding];
    }

    class PriceEstimate extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { data: 0 });
    	}
    }

    return PriceEstimate;

}));
