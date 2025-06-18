package com.example.ruangjiwa.ui.journal;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.JournalEntry;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class JournalAdapter extends RecyclerView.Adapter<JournalAdapter.ViewHolder> {
    
    private List<JournalEntry> journalEntries = new ArrayList<>();
    private OnJournalEntryClickListener listener;
    private SimpleDateFormat dateFormat = new SimpleDateFormat("MMMM dd", Locale.getDefault());
    private SimpleDateFormat timeFormat = new SimpleDateFormat("h:mm a", Locale.getDefault());

    public interface OnJournalEntryClickListener {
        void onJournalEntryClick(JournalEntry entry);
    }

    public JournalAdapter(OnJournalEntryClickListener listener) {
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_journal_entry, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        JournalEntry entry = journalEntries.get(position);
        holder.bind(entry);
    }

    @Override
    public int getItemCount() {
        return journalEntries.size();
    }

    public void setJournalEntries(List<JournalEntry> entries) {
        this.journalEntries = entries != null ? entries : new ArrayList<>();
        notifyDataSetChanged();
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        private TextView journalDate;
        private TextView journalMood;
        private TextView journalTitle;
        private TextView journalPreview;
        private TextView journalTime;
        private TextView journalWordCount;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            journalDate = itemView.findViewById(R.id.journal_date);
            journalMood = itemView.findViewById(R.id.journal_mood);
            journalTitle = itemView.findViewById(R.id.journal_title);
            journalPreview = itemView.findViewById(R.id.journal_preview);
            journalTime = itemView.findViewById(R.id.journal_time);
            journalWordCount = itemView.findViewById(R.id.journal_word_count);

            itemView.setOnClickListener(v -> {
                if (listener != null && getAdapterPosition() != RecyclerView.NO_POSITION) {
                    listener.onJournalEntryClick(journalEntries.get(getAdapterPosition()));
                }
            });
        }

        public void bind(JournalEntry entry) {
            journalDate.setText(dateFormat.format(entry.getDate()));
            journalMood.setText(entry.getMoodEmoji());
            journalTitle.setText(entry.getTitle());
            journalPreview.setText(entry.getPreview());
            journalTime.setText(timeFormat.format(entry.getCreatedAt()));
            journalWordCount.setText(entry.getWordCount() + " words");
        }
    }
}
