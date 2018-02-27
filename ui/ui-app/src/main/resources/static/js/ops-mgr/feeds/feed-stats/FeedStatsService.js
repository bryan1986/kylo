define(["require", "exports", "angular", "./module-name", "../../services/ProvenanceEventStatsService", "underscore", "pascalprecht.translate"], function (require, exports, angular, module_name_1, ProvenanceEventStatsService_1, _) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var d3 = require('../../bower_components/d3');
    var FeedStatsService = /** @class */ (function () {
        function FeedStatsService($q, ProvenanceEventStatsService) {
            var _this = this;
            this.$q = $q;
            this.ProvenanceEventStatsService = ProvenanceEventStatsService;
            this.GetData = function () {
                _this.DEFAULT_CHART_FUNCTION = 'Average Duration';
                _this.processorStatsFunctionMap = {
                    'Average Duration': {
                        axisLabel: 'Time (sec)', fn: function (stats) {
                            return (stats.duration / stats.totalCount) / 1000;
                        }
                    },
                    'Bytes In': {
                        axisLabel: 'Bytes', valueFormatFn: function (d) {
                            return _this.bytesToString(d);
                        }, fn: function (stats) {
                            return stats.bytesIn;
                        }
                    },
                    'Bytes Out': {
                        axisLabel: 'Bytes', valueFormatFn: function (d) {
                            return _this.bytesToString(d);
                        }, fn: function (stats) {
                            return stats.bytesOut;
                        }
                    },
                    'Flows Started': {
                        axisLabel: 'Count', valueFormatFn: function (d) {
                            return d3.format(',')(parseInt(d));
                        }, fn: function (stats) {
                            return stats.jobsStarted != undefined ? stats.jobsStarted : 0;
                        }
                    },
                    'Flows Finished': {
                        axisLabel: 'Count', valueFormatFn: function (d) {
                            return d3.format(',')(parseInt(d));
                        }, fn: function (stats) {
                            return stats.jobsFinished != undefined ? stats.jobsFinished : 0;
                        }
                    },
                    'Total Events': {
                        axisLabel: 'Count', valueFormatFn: function (d) {
                            return d3.format(',')(parseInt(d));
                        }, fn: function (stats) {
                            return stats.totalCount;
                        }
                    },
                    'Failed Events': {
                        axisLabel: 'Count', valueFormatFn: function (d) {
                            return d3.format(',')(parseInt(d));
                        }, fn: function (stats) {
                            return stats.failedCount;
                        }
                    }
                };
                var keepLastSummary = 20;
                var dataSet = [];
                var data = {
                    feedName: '',
                    loadingProcessorStatistics: false,
                    processorStatistics: {
                        topN: 3,
                        lastRefreshTime: '',
                        raw: {},
                        chartData: {
                            chartFunction: '',
                            total: 0,
                            totalFormatted: '',
                            data: dataSet
                        },
                        selectedChartFunction: '',
                        topNProcessorDurationData: dataSet
                    },
                    summaryStatistics: {
                        lastRefreshTime: '',
                        time: { startTime: 0, endTime: 0 },
                        flowsStartedPerSecond: 0,
                        flowsStarted: 0,
                        flowsFinished: 0,
                        flowDuration: 0,
                        flowsFailed: 0,
                        totalEvents: 0,
                        failedEvents: 0,
                        flowsSuccess: 0,
                        flowsRunning: 0,
                        avgFlowDuration: 0
                    },
                    loadingFeedTimeSeriesData: false,
                    feedTimeSeries: {
                        lastRefreshTime: '',
                        time: { startTime: 0, endTime: 0 },
                        minTime: 0,
                        maxTime: 0,
                        raw: dataSet,
                        chartData: dataSet,
                    },
                    feedProcessorErrors: {
                        time: { startTime: 0, endTime: 0 },
                        autoRefresh: true,
                        autoRefreshMessage: "enabled",
                        allData: dataSet,
                        visibleData: dataSet,
                        newErrorCount: 0,
                        viewAllData: function () {
                            var index = this.visibleData.length;
                            if (this.allData.length > index) {
                                var rest = _.rest(this.allData, index);
                                _.each(rest, function (item) {
                                    this.visibleData.push(item);
                                });
                                this.newErrorCount = 0;
                            }
                        }
                    },
                    lastSummaryStats: dataSet,
                    setTimeBoundaries: function (from, to) {
                        _this.fromMillis = from;
                        _this.toMillis = to;
                    },
                    setFeedName: function (feedName) {
                        _this.feedName = feedName;
                    },
                    setSelectedChartFunction: function (selectedChartFunction) {
                        _this.processorStatistics.selectedChartFunction = selectedChartFunction;
                    },
                    formatBytesToString: _this.bytesToString,
                    processorStatsFunctionMap: _this.processorStatsFunctionMap,
                    processorStatsFunctions: function () {
                        return Object.keys(_this.processorStatsFunctionMap);
                    },
                    averageDurationFunction: _this.processorStatsFunctionMap[_this.DEFAULT_CHART_FUNCTION],
                    isLoading: function () {
                        return this.loadingProcessorStatistics || this.loadingFeedTimeSeriesData;
                    },
                    fetchProcessorStatistics: function (minTime, maxTime) {
                        var _this = this;
                        this.loadingProcessorStatistics = true;
                        var deferred = this.$q.defer();
                        var selectedChartFunction = this.processorStatistics.selectedChartFunction;
                        if (angular.isUndefined(minTime)) {
                            minTime = this.fromMillis;
                        }
                        if (angular.isUndefined(maxTime)) {
                            maxTime = this.toMillis;
                        }
                        this.$q.when(this.ProvenanceEventStatsService.getFeedProcessorDuration(this.feedName, minTime, maxTime)).then(function (response) {
                            var processorStatsContainer = response.data;
                            var processorStats = processorStatsContainer.stats;
                            //  topNProcessorDuration(processorStats);
                            var flowsStartedPerSecond = 0;
                            var flowsStarted = 0;
                            var flowsFinished = 0;
                            var flowDuration = 0;
                            var flowsFailed = 0;
                            var totalEvents = 0;
                            var failedEvents = 0;
                            var flowsSuccess = 0;
                            var chartData = [];
                            var processorDuration = [];
                            var chartDataCallbackFunction = function (key, p) {
                                flowsStarted += p.jobsStarted;
                                flowsFinished += p.jobsFinished;
                                flowDuration += p.jobDuration;
                                flowsFailed += p.jobsFailed;
                                totalEvents += p.totalCount;
                                failedEvents += p.failedCount;
                                flowsSuccess = (flowsFinished - flowsFailed);
                                var duration = this.processorStatsFunctionMap['Average Duration'].fn(p);
                                processorDuration.push({ label: key, value: duration });
                            };
                            chartData = this.getChartData(processorStatsContainer, selectedChartFunction, chartDataCallbackFunction);
                            var topNProcessorDurationData = _.sortBy(processorDuration, 'value').reverse();
                            topNProcessorDurationData = _.first(topNProcessorDurationData, this.processorStatistics.topN);
                            var timeDiffMillis = processorStatsContainer.endTime - processorStatsContainer.startTime;
                            var secondsDiff = timeDiffMillis / 1000;
                            this.flowsStartedPerSecond = secondsDiff > 0 ? ((flowsStarted / secondsDiff)).toFixed(2) : 0;
                            this.processorStatistics.raw = processorStatsContainer;
                            var summary = this.summaryStatistics;
                            summary.time.startTime = processorStatsContainer.startTime;
                            summary.time.endTime = processorStatsContainer.endTime;
                            summary.flowsStarted = flowsStarted;
                            summary.flowsFinished = flowsFinished;
                            summary.flowsFailed = flowsFailed;
                            summary.totalEvents = totalEvents;
                            summary.failedEvents = failedEvents;
                            summary.flowsSuccess = flowsSuccess;
                            summary.flowsStartedPerSecond = flowsStartedPerSecond != 0 ? parseFloat(flowsStartedPerSecond.toString()) : flowsStartedPerSecond;
                            summary.avgFlowDurationMilis = (flowsFinished > 0 ? (flowDuration / flowsFinished) : 0);
                            summary.avgFlowDuration = flowsFinished > 0 ? ((flowDuration / flowsFinished) / 1000).toFixed(2) : 0;
                            summary.avgFlowDuration = summary.avgFlowDuration != 0 ? parseFloat(summary.avgFlowDuration) : 0;
                            this.processorStatistics.chartData = chartData;
                            this.processorStatistics.topNProcessorDurationData = topNProcessorDurationData;
                            var refreshTime = new Date().getTime();
                            this.processorStatistics.lastRefreshTime = refreshTime;
                            summary.lastRefreshTime = refreshTime;
                            var lastSummaryStats = angular.copy(this.summaryStatistics);
                            if (this.lastSummaryStats.length >= keepLastSummary) {
                                this.lastSummaryStats.shift();
                            }
                            this.lastSummaryStats.push({ date: refreshTime, data: lastSummaryStats });
                            this.loadingProcessorStatistics = false;
                            deferred.resolve(this.processorStatistics);
                        }, function (err) {
                            _this.loadingProcessorStatistics = false;
                            var refreshTime = new Date().getTime();
                            _this.processorStatistics.lastRefreshTime = refreshTime;
                            _this.summaryStatistics.lastRefreshTime = refreshTime;
                            deferred.reject(err);
                        });
                        return deferred.promise;
                    },
                    changeProcessorChartDataFunction: function (selectedChartFunction) {
                        var chartData = _this.getChartData(_this.processorStatistics.raw, selectedChartFunction);
                        _this.processorStatistics.chartData = chartData;
                        return chartData;
                    },
                    updateBarChartHeight: function (chartOptions, chartApi, rows, chartFunction) {
                        var configMap = this.processorStatsFunctionMap[chartFunction];
                        chartOptions.chart.yAxis.axisLabel = configMap.axisLabel;
                        var chartHeight = 35 * rows;
                        var prevHeight = chartOptions.chart.height;
                        chartOptions.chart.height = chartHeight < 200 ? 200 : chartHeight;
                        var heightChanged = prevHeight != chartOptions.chart.height;
                        if (configMap && configMap.valueFormatFn != undefined) {
                            chartOptions.chart.valueFormat = configMap.valueFormatFn;
                            chartOptions.chart.yAxis.tickFormat = configMap.valueFormatFn;
                        }
                        else {
                            chartOptions.chart.valueFormat = function (d) {
                                return d3.format(',.2f')(d);
                            };
                            chartOptions.chart.yAxis.tickFormat = function (d) {
                                return d3.format(',.2f')(d);
                            };
                        }
                        if (chartApi && chartApi.update) {
                            chartApi.update();
                            if (heightChanged) {
                                chartApi.refresh();
                            }
                        }
                    },
                    buildProcessorDurationChartData: function () {
                        var chartData = this.processorStatistics.chartData;
                        var values = chartData.data;
                        var data = [{ key: "Processor", "color": "#F08C38", values: values }];
                        return data;
                    },
                    buildStatusPieChart: function () {
                        var statusPieChartData = [];
                        statusPieChartData.push({ key: "Successful Flows", value: this.summaryStatistics.flowsSuccess });
                        statusPieChartData.push({ key: "Running Flows", value: this.summaryStatistics.flowsRunning });
                        return statusPieChartData;
                    },
                    buildEventsPieChart: function () {
                        var eventsPieChartData = [];
                        var success = this.summaryStatistics.totalEvents - this.summaryStatistics.failedEvents;
                        eventsPieChartData.push({ key: "Success", value: success });
                        eventsPieChartData.push({ key: "Failed", value: this.summaryStatistics.failedEvents });
                        return eventsPieChartData;
                    },
                    emptyFeedTimeSeriesObject: function (eventTime, feedName) {
                        return {
                            "duration": 0,
                            "minEventTime": eventTime,
                            "maxEventTime": eventTime,
                            "bytesIn": 0,
                            "bytesOut": 0,
                            "totalCount": 0,
                            "failedCount": 0,
                            "jobsStarted": 0,
                            "jobsFinished": 0,
                            "jobsFailed": 0,
                            "jobDuration": 0,
                            "successfulJobDuration": 0,
                            "processorsFailed": 0,
                            "flowFilesStarted": 0,
                            "flowFilesFinished": 0,
                            "maxEventId": 0,
                            "id": this.nullVar,
                            "feedName": feedName,
                            "processorId": this.nullVar,
                            "processorName": this.nullVar,
                            "feedProcessGroupId": this.nullVar,
                            "collectionTime": this.nullVar,
                            "collectionId": this.nullVar,
                            "resultSetCount": this.nullVar,
                            "jobsStartedPerSecond": 0,
                            "jobsFinishedPerSecond": 0,
                            "collectionIntervalSeconds": this.nullVar,
                        };
                    },
                    fetchFeedTimeSeriesData: function () {
                        var deferred = this.$q.defer();
                        this.loadingFeedTimeSeriesData = true;
                        this.$q.when(this.ProvenanceEventStatsService.getFeedStatisticsOverTime(this.feedName, this.fromMillis, this.toMillis)).then(function (response) {
                            var statsContainer = response.data;
                            if (statsContainer.stats == null) {
                                statsContainer.stats = [];
                            }
                            var timeArr = _.map(statsContainer.stats, function (item) {
                                return item.minEventTime != null ? item.minEventTime : item.maxEventTime;
                            });
                            this.summaryStatistics.flowsRunning = statsContainer.runningFlows;
                            this.feedTimeSeries.minTime = this.ArrayUtils.min(timeArr);
                            this.feedTimeSeries.maxTime = this.ArrayUtils.max(timeArr);
                            this.feedTimeSeries.time.startTime = statsContainer.startTime;
                            this.feedTimeSeries.time.endTime = statsContainer.endTime;
                            this.feedTimeSeries.raw = statsContainer;
                            this.loadingFeedTimeSeriesData = false;
                            this.feedTimeSeries.lastRefreshTime = new Date().getTime();
                            deferred.resolve(this.feedTimeSeries);
                        }, function (err) {
                            this.loadingFeedTimeSeriesData = false;
                            this.feedTimeSeries.lastRefreshTime = new Date().getTime();
                            deferred.reject(err);
                        });
                        return deferred.promise;
                    },
                    fetchFeedProcessorErrors: function (resetWindow) {
                        var deferred = this.$q.defer();
                        //reset the collection if we are looking for a new window
                        if (resetWindow) {
                            this.feedProcessorErrors.allData = [];
                            this.feedProcessorErrors.visibleData = [];
                            this.feedProcessorErrors.time.startTime = null;
                            this.feedProcessorErrors.newErrorCount = 0;
                        }
                        this.$q.when(this.ProvenanceEventStatsService.getFeedProcessorErrors(this.feedName, this.fromMillis, this.toMillis, this.feedProcessorErrors.time.endTime)).then(function (response) {
                            var container = response.data;
                            var addToVisible = this.feedProcessorErrors.autoRefresh || this.feedProcessorErrors.visibleData.length == 0;
                            if (container != null && container.errors != null) {
                                _.each(container.errors, function (error) {
                                    //append to errors list
                                    this.feedProcessorErrors.allData.push(error);
                                    if (addToVisible) {
                                        this.feedProcessorErrors.visibleData.push(error);
                                    }
                                });
                            }
                            this.feedProcessorErrors.newErrorCount = this.feedProcessorErrors.allData.length - this.feedProcessorErrors.visibleData.length;
                            this.feedProcessorErrors.time.startTime = container.startTime;
                            this.feedProcessorErrors.time.endTime = container.endTime;
                            deferred.resolve(container);
                        }, function (err) {
                            deferred.reject(err);
                        });
                        return deferred.promise;
                    }
                };
                return data;
            };
            /**
* Gets Chart Data using a function from the (processorStatsFunctionMap) above
* @param functionName a name of the function
* @return {{chartFunction: *, total: number, totalFormatted: number, data: Array}}
*/
            this.getChartData = function (rawData, functionName, callbackFn) {
                var processorStats = rawData.stats;
                var values = [];
                var total = 0;
                var totalFormatted = 0;
                var chartFunctionData = _this.processorStatsFunctionMap[functionName];
                if (chartFunctionData == null || chartFunctionData == undefined) {
                    functionName = _this.DEFAULT_CHART_FUNCTION;
                    chartFunctionData = _this.processorStatsFunctionMap[functionName];
                }
                _.each(processorStats, function (p) {
                    var key = p.processorName;
                    if (key == undefined || key == null) {
                        key = 'N/A';
                    }
                    var v = chartFunctionData.fn(p);
                    values.push({ label: key, value: v });
                    total += v;
                    if (callbackFn != undefined) {
                        callbackFn(key, p);
                    }
                });
                totalFormatted = total;
                if (chartFunctionData && chartFunctionData.valueFormatFn != undefined && angular.isFunction(chartFunctionData.valueFormatFn)) {
                    totalFormatted = chartFunctionData.valueFormatFn(total);
                }
                return {
                    chartFunction: functionName,
                    total: total,
                    totalFormatted: totalFormatted,
                    data: values
                };
            };
            this.bytesToString = function (bytes) {
                var fmt = d3.format('.0f');
                if (bytes < 1024) {
                    return fmt(bytes) + 'B';
                }
                else if (bytes < 1024 * 1024) {
                    return fmt(bytes / 1024) + 'kB';
                }
                else if (bytes < 1024 * 1024 * 1024) {
                    return fmt(bytes / 1024 / 1024) + 'MB';
                }
                else {
                    return fmt(bytes / 1024 / 1024 / 1024) + 'GB';
                }
            };
            this.GetData();
        }
        return FeedStatsService;
    }());
    exports.default = FeedStatsService;
    angular.module(module_name_1.moduleName)
        .service('ProvenanceEventStatsService', ['$http', '$q', 'OpsManagerRestUrlService', ProvenanceEventStatsService_1.default])
        .factory('FeedStatsService', ["$q", "ProvenanceEventStatsService", FeedStatsService]);
});
//# sourceMappingURL=FeedStatsService.js.map