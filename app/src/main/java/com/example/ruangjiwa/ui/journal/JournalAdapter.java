package com.example.ruangjiwa.ui.journal;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.JournalEntry;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class JournalAdapter extends RecyclerView.Adapter<JournalAdapter.JournalViewHolder> {

    private List<JournalEntry> journalEntries;
    private final JournalItemListener listener;

    public interface JournalItemListener {
        void onEntryClick(JournalEntry entry);
        void onFavoriteToggle(JournalEntry entry, boolean isFavorite);
        void onDeleteClick(JournalEntry entry);
    }

    public JournalAdapter(JournalItemListener listener) {
        this.journalEntries = new ArrayList<>();
        this.listener = listener;
    }

    @NonNull
    @Override
    public JournalViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_journal_entry, parent, false);
        return new JournalViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull JournalViewHolder holder, int position) {
        JournalEntry entry = journalEntries.get(position);
        holder.bind(entry);
    }

    @Override
    public int getItemCount() {
        return journalEntries.size();
    }

    public void updateData(List<JournalEntry> newEntries) {
        this.journalEntries = newEntries;
        notifyDataSetChanged();
    }

    class JournalViewHolder extends RecyclerView.ViewHolder {
        private final TextView tvTitle;
        private final TextView tvPreview;
        private final TextView tvDate;
        private final ImageView ivMood;
        private final ImageButton btnFavorite;
        private final ImageButton btnDelete;

        JournalViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tvJournalTitle);
            tvPreview = itemView.findViewById(R.id.tvJournalPreview);
            tvDate = itemView.findViewById(R.id.tvJournalDate);
            ivMood = itemView.findViewById(R.id.ivJournalMood);
            btnFavorite = itemView.findViewById(R.id.btnFavorite);
            btnDelete = itemView.findViewById(R.id.btnDelete);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onEntryClick(journalEntries.get(position));
                }
            });
        }

        void bind(JournalEntry entry) {
            tvTitle.setText(entry.getTitle());

            // Show a preview of the content (first 50 characters)
            String contentPreview = entry.getContent();
            if (contentPreview.length() > 50) {
                contentPreview = contentPreview.substring(0, 47) + "...";
            }
            tvPreview.setText(contentPreview);

            // Format and set the date
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMM yyyy", new Locale("id", "ID"));
            tvDate.setText(dateFormat.format(entry.getCreatedAt()));

            // Set mood icon based on the mood value
            if (entry.getMood() != null) {
                ivMood.setImageResource(entry.getMood().getIconResource());
            } else {
                ivMood.setVisibility(View.GONE);
            }

            // Set favorite button state
            if (entry.isFavorite()) {
                btnFavorite.setImageResource(R.drawable.ic_favorite_filled);
            } else {
                btnFavorite.setImageResource(R.drawable.ic_favorite_outline);
            }

            // Set click listeners for action buttons
            btnFavorite.setOnClickListener(v -> {
                boolean newState = !entry.isFavorite();
                entry.setFavorite(newState);
                btnFavorite.setImageResource(newState ?
                        R.drawable.ic_favorite_filled : R.drawable.ic_favorite_outline);
                listener.onFavoriteToggle(entry, newState);
            });

            btnDelete.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onDeleteClick(entry);
                }
            });
        }
    }
}
