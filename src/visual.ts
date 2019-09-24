
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
import { svg } from "d3";
export interface TestItem {
    Label: string;
    Val: number;
    start: number;
    end: number;
    class: string;
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
    private margin = { top:20, right: 120, bottom: 200, left: 70 };
    constructor(options: VisualConstructorOptions) {
        this.svg = d3.select(options.element).append('svg')
        .style("width", 550 + 'px')
        .style("height", 590 + 'px');
        this.g = this.svg.append('g');
    }

    public update(options: VisualUpdateOptions) {
        let _this = this;

        // get height and width from viewport
        // this.svg.attr({
        //    width:options.viewport.width,
        //     height:options.viewport.height
        // } as any);
        let gHeight = options.viewport.height
            - _this.margin.top
            - _this.margin.bottom;
        let gWidth = options.viewport.width
            - _this.margin.right
            - _this.margin.left;
        // this.g.attr({
        //     width: options.viewport.width,
        //     height: options.viewport.height
        // } as any);
        _this.g.attr('transform',
            `translate(${_this.margin.left}, ${_this.margin.top})`);

        // convert data format
        let avg = Visual.avg(options);
        let dat =
            Visual.converter(options,avg);

        // setup d3 scale
        let xScale = d3.scaleBand()
            .domain(dat.map((d) => { return d.Label; }))
            .range([0, 450]);
        let yMax =
            d3.max(dat, (d) => { return d.Val + 10 });
        let yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([gHeight, 0]);

        // remove existing axis and bar
        _this.svg.selectAll('.axis').remove();
        _this.svg.selectAll('.bar').remove();
        //Draw X Axes
        let xAxis = d3.axisBottom(xScale).
            tickFormat(function (d) { return d; });
        _this.g
            .append('g')
            .attr('class', 'x axis')
            .style('fill', 'black')
            .attr('transform', `translate(0, ${(gHeight - 1)})`)
            .call(xAxis)
            .selectAll('text') // rotate text
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '-.6em')
            .attr('transform', 'rotate(-90)');
     
            _this.g.call(d3.zoom().on('zoom', function() {
                console.log('zoom');
                _this.g.attr('transform', d3.event.transform);
            }));
        //Draw Y Axes
        let yAxis = d3.axisLeft(yScale);
        _this.g
            .append('g')
            .attr('class', 'y axis')
            .style('fill', 'black')
            .call(yAxis);

        //**************************************************************************************************** */
        var cumulative = 0;
        for (var i = 0; i < dat.length; i++) {
            dat[i].start = cumulative;
            cumulative += dat[i].Val;
            dat[i].end = cumulative;

            dat[i].class = (dat[i].Val >= 0) ? 'positive' : 'negative'
        }
        dat.push({
            Label: 'Total',
            end: cumulative,
            start: 0,
            class: 'total',
            Val: cumulative
        });

        xScale.domain(dat.map(function (d) {
            return d.Label;
        }));
        yScale.domain([0, d3.max(dat, function (d) {
          
            return d.end;
        })]);


        var ticks = d3.selectAll(".x.axis text").each(function (d, i) {
            if (i < 3) {
                d3.select(this).attr("y", 0)
                d3.select(this).attr("x", 10)
                d3.select(this).attr("dy", ".35em")
                d3.select(this).attr("transform", "rotate(90)")
                d3.select(this).style("text-anchor", "start");
            }
        });

        var bar = this.g.selectAll(".bar")
            .data(dat)
            .enter().append("g")
            .attr("class", function (d) {
                return "bar " + d.class
            })
            .attr("transform", function (d) {
                return "translate(" + xScale(d.Label) + ",0)";
            });

        bar.append("rect")
            .attr("y", function (d) {
                return yScale(Math.max(d.start, d.end));
            })
            .attr("height", function (d) {
                return Math.abs(yScale(d.start) - yScale(d.end));
            })
            .attr("width", xScale.bandwidth());

        bar.append("text")
            .attr("x", xScale.bandwidth() / 2)
            .attr("y", function (d) {
                return yScale(d.end) + 5;
            })
            .attr("dy", function (d) {
                return ((d.class == 'negative') ? '-' : '') + ".75em"
            })
            .text(function (d) {
                return Visual.dollarFormatter(d.end - d.start);
            });

        let padding = 0.3;
        bar.filter(function (d) {
            return d.class != "total"
        }).append("line")
            .attr("class", "connector")
            .attr("x1", xScale.bandwidth() + 5)
            .attr("y1", function (d) {
                return yScale(d.end)
            })
            .attr("x2", xScale.bandwidth() / (1 - padding) - 5)
            .attr("y2", function (d) {
                return yScale(d.end)
            })    
    }
  

    public static converter(options: VisualUpdateOptions, converter: any): TestItem[] {

        let categorical = options.dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];

        let rows = categorical.categories[0].values;

        let resultData: TestItem[] = [];
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];          
            resultData.push({
                Label: row.toString(),
                Val: +dataValue.values[i],
                class: null,
                end: null,
                start: null
            });
        }
        console.log(resultData);
        return resultData;
    }

    public static avg(options: VisualUpdateOptions): any {

        let categorical = options.dataViews[0].categorical;       
        let dataValue = categorical.values[0];
        let rows = categorical.categories[0].values;     
        let avg=0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
          if(i != 0 && i!= rows.length)
          {
             avg=+dataValue.values[i] ;           
          }         
        }
        let res=avg/(categorical.categories[0].values.length-2);
        console.log(avg);
        return res;
        
    }
    public static converter2(options: VisualUpdateOptions, svg:any): TestItem[] {

        let categorical = options.dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values[0];

        let rows = categorical.categories[0].values;

        let resultData: TestItem[] = [];
        let avg=0;
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
          if(i == 0 || i== rows.length)
          {
             avg=+dataValue.values[i];
            resultData.push({
                Label: row.toString(),
                Val: +dataValue.values[i],
                class: null,
                end: null,
                start: null
            });
          }
          else{
            resultData.push({
                Label: row.toString(),
                Val: +dataValue.values[i],
                class: null,
                end: null,
                start: null
            });
        }
        }
        console.log(resultData);
        return resultData;
    }
    public static percentage(n): number {
        n = Math.round(n);
        var result = n;
        if (Math.abs(n) > 100) {
            result = Math.round(n / 100) + '%';
        }
        return result;
    }
    public static dollarFormatter(n) {
        n = Math.round(n);
        var result = n;
        if (Math.abs(n) > 1000) {
            result = Math.round(n / 1000) + 'K';
        }
        return result;
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
