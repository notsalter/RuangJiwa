package com.example.ruangjiwa.ui.mood;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.MoodEntry;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class MoodHistoryAdapter extends RecyclerView.Adapter<MoodHistoryAdapter.MoodViewHolder> {

    private final List<MoodEntry> moodEntries;
    private OnMoodItemClickListener listener;

    public interface OnMoodItemClickListener {
        void onMoodItemClick(MoodEntry moodEntry);
    }

    public MoodHistoryAdapter(List<MoodEntry> moodEntries) {
        this.moodEntries = moodEntries;
    }

    public void setOnMoodItemClickListener(OnMoodItemClickListener listener) {
        this.listener = listener;
    }

    @NonNull
    @Override
    public MoodViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_mood_history, parent, false);
        return new MoodViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MoodViewHolder holder, int position) {
        holder.bind(moodEntries.get(position));
    }

    @Override
    public int getItemCount() {
        return moodEntries.size();
    }

    class MoodViewHolder extends RecyclerView.ViewHolder {
        private final ImageView ivMoodIcon;
        private final TextView tvMood;
        private final TextView tvDateTime;
        private final TextView tvNotes;
        private final ChipGroup chipGroupTags;

        public MoodViewHolder(@NonNull View itemView) {
            super(itemView);
            ivMoodIcon = itemView.findViewById(R.id.iv_mood_icon);
            tvMood = itemView.findViewById(R.id.tv_mood);
            tvDateTime = itemView.findViewById(R.id.tv_date_time);
            tvNotes = itemView.findViewById(R.id.tv_notes);
            chipGroupTags = itemView.findViewById(R.id.chip_group_tags);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onMoodItemClick(moodEntries.get(position));
                }
            });
        }

        public void bind(MoodEntry entry) {
            // Set mood icon and text
            ivMoodIcon.setImageResource(entry.getMood().getIconResource());
            ivMoodIcon.setColorFilter(itemView.getContext().getColor(entry.getMood().getColorResource()));
            tvMood.setText(entry.getMood().getDisplayName());

            // Format and set date/time
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy, HH:mm", new Locale("id", "ID"));
            tvDateTime.setText(dateFormat.format(entry.getDate()));

            // Set notes (if any)
            if (entry.getNotes() != null && !entry.getNotes().isEmpty()) {
                tvNotes.setVisibility(View.VISIBLE);
                tvNotes.setText(entry.getNotes());
            } else {
                tvNotes.setVisibility(View.GONE);
            }

            // Add tags (if any)
            chipGroupTags.removeAllViews();
            if (entry.getTags() != null && entry.getTags().length > 0) {
                chipGroupTags.setVisibility(View.VISIBLE);
                for (String tag : entry.getTags()) {
                    Chip chip = (Chip) LayoutInflater.from(itemView.getContext())
                            .inflate(R.layout.item_tag_chip, chipGroupTags, false);
                    chip.setText(tag);
                    chipGroupTags.addView(chip);
                }
            } else {
                chipGroupTags.setVisibility(View.GONE);
            }
        }
    }
}
