package com.example.ruangjiwa.ui.journal;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.JournalEntry;
import com.example.ruangjiwa.data.model.Mood;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class JournalEntryAdapter extends RecyclerView.Adapter<JournalEntryAdapter.JournalEntryViewHolder> {

    private final List<JournalEntry> entries;
    private final OnEntryClickListener listener;

    public interface OnEntryClickListener {
        void onEntryClick(JournalEntry entry);
    }

    public JournalEntryAdapter(List<JournalEntry> entries, OnEntryClickListener listener) {
        this.entries = entries;
        this.listener = listener;
    }

    @NonNull
    @Override
    public JournalEntryViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_journal_entry, parent, false);
        return new JournalEntryViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull JournalEntryViewHolder holder, int position) {
        holder.bind(entries.get(position));
    }

    @Override
    public int getItemCount() {
        return entries.size();
    }

    class JournalEntryViewHolder extends RecyclerView.ViewHolder {
        private final ImageView ivMoodIcon;
        private final TextView tvMood;
        private final TextView tvDate;
        private final TextView tvContent;
        private final ChipGroup chipGroupTags;
        private final ImageView ivPrivate;

        public JournalEntryViewHolder(@NonNull View itemView) {
            super(itemView);
            ivMoodIcon = itemView.findViewById(R.id.iv_mood_icon);
            tvMood = itemView.findViewById(R.id.tv_mood);
            tvDate = itemView.findViewById(R.id.tv_date);
            tvContent = itemView.findViewById(R.id.tv_content);
            chipGroupTags = itemView.findViewById(R.id.chip_group_tags);
            ivPrivate = itemView.findViewById(R.id.iv_private);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onEntryClick(entries.get(position));
                }
            });
        }

        public void bind(JournalEntry entry) {
            // Set mood icon and text
            Mood mood = entry.getMood();
            ivMoodIcon.setImageResource(mood.getIconResource());
            ivMoodIcon.setColorFilter(itemView.getContext().getColor(mood.getColorResource()));
            tvMood.setText(mood.getDisplayName());

            // Format and set date
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
            tvDate.setText(dateFormat.format(entry.getDate()));

            // Set content (truncated if needed)
            String content = entry.getContent();
            if (content.length() > 150) {
                content = content.substring(0, 147) + "...";
            }
            tvContent.setText(content);

            // Add tags
            chipGroupTags.removeAllViews();
            for (String tag : entry.getTags()) {
                Chip chip = (Chip) LayoutInflater.from(itemView.getContext())
                        .inflate(R.layout.item_tag_chip, chipGroupTags, false);
                chip.setText(tag);
                chipGroupTags.addView(chip);
            }

            // Show/hide private indicator
            if (entry.isPrivate()) {
                ivPrivate.setVisibility(View.VISIBLE);
            } else {
                ivPrivate.setVisibility(View.GONE);
            }
        }
    }
}
