package com.example.ruangjiwa.ui.mood;

import android.graphics.Color;
import android.widget.TextView;

import com.example.ruangjiwa.R;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;

import java.util.ArrayList;
import java.util.List;

/**
 * Helper class to manage mood chart visualization
 */
public class ChartManager {

    private final LineChart chart;

    public ChartManager(LineChart chart) {
        this.chart = chart;
        setupChart();
    }

    private void setupChart() {
        // Basic chart setup
        chart.setDrawGridBackground(false);
        chart.getDescription().setEnabled(false);
        chart.setDrawBorders(false);
        chart.getLegend().setEnabled(false);

        // Enable touch gestures
        chart.setTouchEnabled(true);
        chart.setDragEnabled(true);
        chart.setScaleEnabled(true);

        // Set up X axis
        XAxis xAxis = chart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setTextColor(Color.GRAY);
        xAxis.setTextSize(10f);

        // Set up Y axis
        YAxis leftAxis = chart.getAxisLeft();
        leftAxis.setAxisMinimum(1f);
        leftAxis.setAxisMaximum(10f);
        leftAxis.setDrawGridLines(true);
        leftAxis.setGridColor(Color.parseColor("#EEEEEE"));
        leftAxis.setTextColor(Color.GRAY);
        leftAxis.setTextSize(10f);

        // Disable right Y axis
        chart.getAxisRight().setEnabled(false);
    }

    public void updateChart(List<MoodDataPoint> dataPoints) {
        // Create entries from data points
        List<Entry> entries = new ArrayList<>();
        List<String> xLabels = new ArrayList<>();

        for (int i = 0; i < dataPoints.size(); i++) {
            MoodDataPoint point = dataPoints.get(i);
            entries.add(new Entry(i, point.getIntensity()));
            xLabels.add(point.getDate());
        }

        // Create dataset
        LineDataSet dataSet = new LineDataSet(entries, "Mood");
        styleDataSet(dataSet);

        // Set X-axis labels
        chart.getXAxis().setValueFormatter(new IndexAxisValueFormatter(xLabels));

        // Set data
        LineData lineData = new LineData(dataSet);
        chart.setData(lineData);

        // Refresh
        chart.invalidate();
    }

    private void styleDataSet(LineDataSet dataSet) {
        int primaryColor = chart.getContext().getColor(R.color.primary);

        // Line styling
        dataSet.setColor(primaryColor);
        dataSet.setLineWidth(3f);
        dataSet.setDrawValues(false);
        dataSet.setDrawCircles(true);
        dataSet.setCircleRadius(4f);
        dataSet.setCircleColor(primaryColor);

        // Fill styling
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(primaryColor);
        dataSet.setFillAlpha(50);

        // Mode styling
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
    }
}
