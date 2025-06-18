package com.example.ruangjiwa.ui.journal;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.example.ruangjiwa.data.model.JournalEntry;
import com.example.ruangjiwa.data.model.Mood;
import com.example.ruangjiwa.databinding.FragmentJournalEntryDetailBinding;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.android.material.chip.Chip;
import com.google.firebase.firestore.FirebaseFirestore;

import java.text.SimpleDateFormat;
import java.util.Locale;

public class JournalEntryDetailFragment extends BottomSheetDialogFragment {

    private FragmentJournalEntryDetailBinding binding;
    private String entryId;
    private FirebaseFirestore db;
    private JournalEntry entry;

    private static final String ARG_ENTRY_ID = "entry_id";

    public static JournalEntryDetailFragment newInstance(String entryId) {
        JournalEntryDetailFragment fragment = new JournalEntryDetailFragment();
        Bundle args = new Bundle();
        args.putString(ARG_ENTRY_ID, entryId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            entryId = getArguments().getString(ARG_ENTRY_ID);
        }
        db = FirebaseFirestore.getInstance();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentJournalEntryDetailBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Load journal entry
        loadJournalEntry();

        // Setup action buttons
        binding.btnEdit.setOnClickListener(v -> editEntry());
        binding.btnDelete.setOnClickListener(v -> deleteEntry());
        binding.btnClose.setOnClickListener(v -> dismiss());
    }

    private void loadJournalEntry() {
        // In a real app, this would fetch from Firebase
        // For demo purposes, using mock data

        if ("1".equals(entryId)) {
            // Create a sample entry
            entry = new JournalEntry(
                "1",
                "user1",
                "Hari ini adalah hari yang luar biasa! Presentasi projekku mendapat apresiasi yang sangat baik dari tim. Aku merasa sangat bersyukur atas dukungan rekan-rekan kerja yang selalu membantu. Pengalaman ini mengajarkan bahwa kolaborasi dan komunikasi adalah kunci untuk hasil yang baik.\n\nAku juga senang karena akhirnya bisa menyelesaikan bagian tersulit dari proyek ini tepat waktu. Rasanya seperti beban berat terangkat dari pundak. Sekarang aku bisa fokus pada tahap berikutnya dengan lebih tenang.",
                java.util.Calendar.getInstance().getTime(),
                Mood.HAPPY,
                new String[]{"Prestasi", "Bersyukur"},
                false
            );
        } else if ("2".equals(entryId)) {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.add(java.util.Calendar.DAY_OF_MONTH, -1);

            entry = new JournalEntry(
                "2",
                "user1",
                "Hari yang cukup normal. Menghabiskan waktu dengan rutinitas biasa di kantor. Mungkin aku perlu mencoba hal-hal baru untuk membuat hari-hariku lebih berwarna. Terkadang rutinitas yang sama membuatku merasa stagnan.\n\nAku berpikir untuk mulai mengambil kursus online atau mencoba hobi baru di akhir pekan. Mungkin fotografi atau memasak bisa menjadi pilihan yang menarik.",
                cal.getTime(),
                Mood.NEUTRAL,
                new String[]{"Refleksi", "Rutinitas"},
                false
            );
        } else if ("3".equals(entryId)) {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.add(java.util.Calendar.DAY_OF_MONTH, -2);

            entry = new JournalEntry(
                "3",
                "user1",
                "Hari ini aku merasa sedikit down karena beberapa masalah di kantor. Tapi aku mencoba untuk tetap positif dan mencari solusi terbaik. Besok pasti akan lebih baik. Aku perlu mengingatkan diriku bahwa tantangan adalah bagian dari proses pertumbuhan.\n\nAku mencoba beberapa teknik pernapasan yang kutemukan di aplikasi ini untuk menenangkan diri, dan itu cukup membantu. Malam ini aku akan tidur lebih awal dan berharap bangun dengan perspektif yang lebih segar besok.",
                cal.getTime(),
                Mood.SAD,
                new String[]{"Tantangan", "Optimis"},
                true
            );
        } else {
            // If entry not found, close the fragment
            Toast.makeText(requireContext(), "Catatan tidak ditemukan", Toast.LENGTH_SHORT).show();
            dismiss();
            return;
        }

        displayEntry();
    }

    private void displayEntry() {
        if (entry == null) return;

        // Set mood icon and text
        binding.ivMoodIcon.setImageResource(entry.getMood().getIconResource());
        binding.ivMoodIcon.setColorFilter(requireContext().getColor(entry.getMood().getColorResource()));
        binding.tvMood.setText(entry.getMood().getDisplayName());

        // Format and set date
        SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, dd MMMM yyyy", new Locale("id", "ID"));
        binding.tvDate.setText(dateFormat.format(entry.getDate()));

        // Set content
        binding.tvContent.setText(entry.getContent());

        // Add tags
        binding.chipGroupTags.removeAllViews();
        for (String tag : entry.getTags()) {
            Chip chip = new Chip(requireContext());
            chip.setText(tag);
            binding.chipGroupTags.addView(chip);
        }

        // Show/hide private indicator
        if (entry.isPrivate()) {
            binding.ivPrivate.setVisibility(View.VISIBLE);
            binding.tvPrivate.setVisibility(View.VISIBLE);
        } else {
            binding.ivPrivate.setVisibility(View.GONE);
            binding.tvPrivate.setVisibility(View.GONE);
        }
    }

    private void editEntry() {
        // In a real app, this would open an editor for the entry
        Toast.makeText(requireContext(), "Fitur edit akan segera tersedia", Toast.LENGTH_SHORT).show();
    }

    private void deleteEntry() {
        // In a real app, this would show a confirmation dialog and delete the entry
        Toast.makeText(requireContext(), "Catatan berhasil dihapus", Toast.LENGTH_SHORT).show();
        dismiss();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
