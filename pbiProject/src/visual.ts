
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";
import * as d3 from "d3";
export interface TestItem {
    Label: string;
    Val: number;
}
export class Visual implements IVisual {

    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    //private svg: d3.Selection<SVGGElement, {}, null, undefined>;
    private new_p: HTMLElement;

    private svg: d3.Selection<d3.BaseType, any, HTMLElement, any>;
    private g: d3.Selection<d3.BaseType, any, HTMLElement, any>;
    private margin = { top: 20, right: 20, bottom: 200, left: 70 };
    constructor(options: VisualConstructorOptions) {
        this.svg = d3.select(options.element).append('svg');
        this.g = this.svg.append('g');
    }

    public update(options: VisualUpdateOptions) {
        let _this = this;

        // get height and width from viewport
        this.svg.attr({
            width: options.viewport.width,
            height: options.viewport.height
        } as any);
        let gHeight = options.viewport.height
            - _this.margin.top
            - _this.margin.bottom;
        let gWidth = options.viewport.width
            - _this.margin.right
            - _this.margin.left;
        this.g.attr({
            width: options.viewport.width,
            height: options.viewport.height
        } as any);
        _this.g.attr('transform',
            `translate(${_this.margin.left}, ${_this.margin.top})`);

        // convert data format
        let dat =
            Visual.converter(options);

        // setup d3 scale
        let xScale = d3.scaleBand()
            .domain(dat.map((d) => { return d.Label; }))
            .range([0, 150]);
        let yMax =
            d3.max(dat, (d) => { return d.Val + 10 });
        let yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([gHeight, 0]);

        // remove existing axis and bar
        _this.svg.selectAll('.axis').remove();
        _this.svg.selectAll('.bar').remove();

        // draw x axis
        // let xAxis = d3.svg.axis()
        //     .scale(xScale)
        //     .orient('bottom');
        _this.g
            .append('g')
            .attr('class', 'x axis')
            .style('fill', 'black')
            .attr('transform', `translate(0, ${(gHeight - 1)})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text') // rotate text
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '-.6em')
            .attr('transform', 'rotate(-90)');

        // draw y axis
        // let yAxis = d3.svg.axis()
        //     .scale(yScale)
        //     .orient('left');
        _this.g
            .append('g')
            .attr('class', 'y axis')
            .style('fill', 'black')
            .call(d3.axisBottom(yScale));

        // draw bar
        let shapes = _this.g
            .append('g')
            .selectAll('.bar')
            .data(dat);

        // shapes.enter()
        //     .append('rect')
        //     .attr('class', 'bar')
        //     .attr('fill', 'yellow')
        //     .attr('stroke', 'black')
        //     .attr('x', (d) => {
        //         return xScale(d.Val.toString());
        //     })
        //     .attr('width', xScale.rangeBand())
        //     .attr('y', (d) => {
        //         return yScale(d.Label);
        //     })
        //     .attr('height', (d) => {
        //         return gHeight - yScale(d.Label);
        //     });

        // shapes
        //     .exit()


    }
    public static converter(options: VisualUpdateOptions): TestItem[] {

        let categorical = options.dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];
        // console.log("categorical",categorical);
        // console.log("category",category);
        // console.log("dataValue",dataValue);

        let rows = categorical.categories[0].values;
        // console.log("row", rows);

        let resultData: TestItem[] = [];
        //convert from ['x', y] to [{"x":x, "y": y}]
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            console.log(dataValue.values[i]);
            resultData.push({
                Label: row.toString(),
                Val: +dataValue.values[i]
            });
        }
        return resultData;
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        var seting = VisualSettings.parse(dataView) as VisualSettings;
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}