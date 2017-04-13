var hook = {

    prepareData: function (neuron){
        var context = this;
        var i = 0;
        var pt;
        context.data.length = 0;
        while (pt = neuron.children['p' + ('0' + i).slice(-2)]) {
            console.log(pt);
            context.data.push({tx: pt.children.x.value, ty: pt.children.y.value, path: 'p' + ('0' + i).slice(-2) + '/y'});
            i++;
        }
        console.log(context.data);
    },

    init: function (path, neuron, g) {
        console.log(neuron);

        var context = this;

        context.data = [];

        context.g = g;

        context.prepareData(neuron);

        //var data = [{x: 10, y: 0}, {x: 50, y: 80}, {x: 90, y: 50}];

        /*var svg = d3.select("svg"),*/
        var width = 100,
            height = 100,
            radius = 5;

        /*var g = svg.append("g");*/

        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        /*svg.call(d3.zoom()
         .scaleExtent([1 / 2, 8])
         .on("zoom", zoomed));

         function zoomed() {
         g.attr("transform", d3.event.transform);
         }*/

        function dragstarted(d) {
            //d3.select(this).raise().classed("active", true);
            //d.x = d3.event.x;
            //d.y = d3.event.y;
            console.log("Event X:" + d3.event.x);
            console.log("Event Y:" + d3.event.y);

        }

        function dragged(d) {
            console.log("Event X:" + d3.event.x);
            console.log("Event Y:" + d3.event.y);
            if (d3.event.y >= 0 && d3.event.y <= width) {
                d3.select(this).
                    /*attr("cx", d.x = d3.event.x).*/attr("cy", d.y = (Math.round(d3.event.y * 1) / 1));
                //updatePath();
            }
        }

        function dragended(d, i) {
            //d3.select(this).classed("active", false);
            d.ty = y.invert(d.y);
            setValue2(path + '/' + d.path, d.ty, function (err) {
                if (err) {
                    d3.select("#result").text(err);
                } else {
                    d3.select("#result").text('Изменение внесено');
                    //updatePath();
                    //context.update(neuron);
                }
            });

        }

        // Scale the range of the data
        x.domain(d3.extent(context.data, function (d) {
            return d.tx;
        }));
        y.domain([0, 100]);
        // define the line
        context.valueline = d3.line()
            .x(function (d) {
                return (d.x = x(d.tx));
            })
            .y(function (d) {
                return (d.y = y(d.ty));
            });


        // Add the valueline path.
        g.append("path")
            .data([context.data])
            .attr("class", "line")
            .attr("d", context.valueline);

        /*function updatePath() {
            g.select('path').attr("d", valueline);
        }*/


        // Add the X Axis
        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(x).ticks(5));

        // Add the Y Axis
        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y));

        var points = g.selectAll("circle")
            .data(context.data)
            .enter().append("circle")
            .attr("r", 3)
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .attr("class", "graphpoint");
        //.on("mouseover", function(d) {
        //    //d3.select(this).attr("fill", "red");
        //});
        points.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    },

    update: function (neuron){
        this.prepareData(neuron);
        this.g.select('path').attr("d", this.valueline);
    }
};
