package com.example.ruangjiwa.ui.consultation;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.QuizHistory;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class QuizHistoryAdapter extends RecyclerView.Adapter<QuizHistoryAdapter.ViewHolder> {

    private List<QuizHistory> historyList;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy, HH:mm", new Locale("id", "ID"));

    public QuizHistoryAdapter(List<QuizHistory> historyList) {
        this.historyList = historyList;
        Log.d("QuizHistoryAdapter", "Adapter created with " + (historyList != null ? historyList.size() : 0) + " items");
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_quiz_history, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        try {
            QuizHistory history = historyList.get(position);
            Log.d("QuizHistoryAdapter", "Binding item at position " + position + ": " + history.getCategory());

            // Format date safely
            if (history.getTimestamp() != null) {
                try {
                    Date date = history.getTimestamp().toDate();
                    String formattedDate = dateFormat.format(date);
                    holder.tvDate.setText(formattedDate);
                } catch (Exception e) {
                    Log.e("QuizHistoryAdapter", "Error formatting date: " + e.getMessage());
                    holder.tvDate.setText("(tanggal tidak tersedia)");
                }
            } else {
                holder.tvDate.setText("(tanggal tidak tersedia)");
            }

            // Set category and score safely
            String category = history.getCategory();
            holder.tvCategory.setText(category != null ? category : "Tidak ada kategori");
            holder.tvScore.setText(history.getScore() + " poin");
        } catch (Exception e) {
            Log.e("QuizHistoryAdapter", "Error binding view holder: " + e.getMessage());
        }
    }

    @Override
    public int getItemCount() {
        return historyList != null ? historyList.size() : 0;
    }

    public void updateData(List<QuizHistory> newHistoryList) {
        this.historyList = newHistoryList;
        Log.d("QuizHistoryAdapter", "Data updated with " + (newHistoryList != null ? newHistoryList.size() : 0) + " items");
        notifyDataSetChanged();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvDate, tvCategory, tvScore;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDate = itemView.findViewById(R.id.tvQuizDate);
            tvCategory = itemView.findViewById(R.id.tvQuizCategory);
            tvScore = itemView.findViewById(R.id.tvQuizScore);
        }
    }
}
