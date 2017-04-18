var hmi = {
    value: {
        init: function (g, neuron, options) {
            g.attr("class", "hmiValue")
                .attr("data-quality", neuron.quality);
            g.append("rect")
                .attr("width", 30)
                .attr("height", 10);

            g.append("text")
                .attr("y", 5)
                .attr("textLength", 20)
                .attr("lengthAdjust", "spacingAndGlyphs")
                .attr("style", "font-size: 10px; alignment-baseline: central;")
                .text(neuron.value);

            g.append("text")
                .attr("y", 5)
                .attr("x", 20)
                .attr("textLength", 10)
                .attr("lengthAdjust", "spacingAndGlyphs")
                .attr("style", "font-size: 10px; alignment-baseline: central;")
                .text(neuron.unit);

            return g;
        },

        update: function (g, neuron, options) {
            g.attr("data-quality", neuron.quality);
            g.select("text")
                .text(neuron.value);
        }
    },

    svg: {
        hook : function() {
            return {
                init: function (path, neuron, g) {
                    console.log(neuron);

                    var context = this;
                    context.neuron = neuron;

                    context.g = g;

                    g.on('click', function() {
                        d3.event.stopPropagation();
                        getNeuron(path);
                    });

                    context.taggedStuff = context.g.selectAll('[data-tag]');
                    context.evalStuff = context.g.selectAll('[data-eval]');
                    context.taggedTexts = context.g.selectAll('text[data-tag],tspan[data-tag]');

                    // no point to do following here, cause update will be called soon
                    /*context.taggedTexts.text(function(){
                        return neuron.children[d3.select(this).attr('data-tag')].value;
                    });

                    context.taggedStuff.attr('data-value', function(){
                        //return neuron.children[d3.select(this).attr('data-tag')].value;
                        return hmi.getNeuron(neuron, d3.select(this).attr('data-tag')).value;
                    });*/


                    context.commandStuff = context.g.selectAll('[data-tag][data-set]');

                    context.commandStuff.on('mousedown', function() { d3.event.stopImmediatePropagation(); }); // prevent panning instead of clicking to make clicking easier on touch screens
                    context.commandStuff.on('click', function(){
                        d3.event.stopPropagation();
                        var me = d3.select(this);
                        var neuron = context.neuron;
                        var tag = me.attr('data-tag');
                        var set = me.attr('data-set');

                        if(set === '?'){
                            $(".validateTips").text('Введите новое значение:');
                            $("#newVal").val(hmi.getNeuron(neuron, tag).value);
                            $( "#dialog-form" ).dialog( "open" );
                            //.appendTo('#tabs-face');
                            //$( "#dialog-plate" ).dialog( "open" );
                            idToSet = path + (path?'/':'') + tag;
                            console.log( idToSet );

                        } else {
                            setValue2(path + (path?'/':'') + tag, eval(set), function (err) {
                                if (err) {
                                    console.log('error occured on setting value: ' + err);
                                    d3.select("#result").text(err);
                                } else {
                                    console.log('value was set');
                                    d3.select("#result").text('Изменение внесено');
                                    //updatePath();
                                    //context.update(neuron);
                                }
                            });
                        }
                    });

                    context.children = {
                        //curve: {g: g.append("g")
                        //    .attr("style", "transform-origin: 0 100")
                        //    .attr("transform", "translate(25,15) scale(0.6,0.6)")
                        //}
                    };

                    context.childrenGroups = context.g.selectAll('g[data-child]');
                    context.childrenGroups.each(function(){
                        var group = d3.select(this).classed("hmiMnemo", true);;
                        context.children[group.attr('data-child')] = {g:group};
                    });

                    context.update(neuron);

                    return context.children;
                },

                update: function (neuron){
                    var context = this;
                    context.neuron = neuron;
                    
                    context.taggedTexts.text(function(){
                        var node = hmi.getNeuron(neuron, d3.select(this).attr('data-tag'));
                        return (node.state && node.showState)?node.state[0].text:(node.value + ' ' + (node.unit?node.unit:''));
                    });

                    context.taggedStuff.attr('data-value', function(){
                        return hmi.getNeuron(neuron, d3.select(this).attr('data-tag')).value;
                    });

                    context.taggedStuff.attr('data-quality', function(){
                        return hmi.getNeuron(neuron, d3.select(this).attr('data-tag')).quality;
                    });

                    context.taggedStuff.attr('data-state', function(){
                        var node = hmi.getNeuron(neuron, d3.select(this).attr('data-tag'));
                        return node.state?node.state[0].level:0
                    });

                    context.evalStuff.each(function(){
                        var me = d3.select(this);
                        var neuron = context.neuron;
                        eval(me.attr('data-eval'));
                    });

                }

            };
        }
    },

    getNeuron(neuron, path) { // extracts subneurons by path
        if (typeof path === 'string') {
            path = path.split('/');
        }

        if(path.length === 0 || path[0] === '') return neuron;

        var child = neuron.children[path.shift()];

        if (child) {
            return hmi.getNeuron(child, path);
        }

        return {};
    }
};