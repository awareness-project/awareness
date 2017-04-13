var hook = {

    init: function (path, neuron, g) {
        console.log(neuron);

        var context = this;

        context.g = g;

        var width = 100,
            height = 100;

        this.tOut = hmi.value.init(g.append("g").attr("transform", "translate(0,65) scale(1,1) rotate(-90)"), neuron);
        this.tIn = hmi.value.init(g.append("g").attr("transform", "translate(35,90) scale(1,1)"), neuron.children.source);

        this.children = {
            curve: {g: g.append("g")
                .attr("style", "transform-origin: 0 100")
                .attr("transform", "translate(25,15) scale(0.6,0.6)")
            }
        };

        return this.children;
    },

    update: function (neuron){
        hmi.value.update(this.tOut , neuron);
        hmi.value.update(this.tIn , neuron.children.source);
    }
};
