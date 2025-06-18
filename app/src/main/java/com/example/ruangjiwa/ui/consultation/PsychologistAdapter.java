package com.example.ruangjiwa.ui.consultation;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Psychologist;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;

import java.util.List;

public class PsychologistAdapter extends RecyclerView.Adapter<PsychologistAdapter.PsychologistViewHolder> {

    private final List<Psychologist> psychologistList;
    private final OnPsychologistClickListener listener;

    public interface OnPsychologistClickListener {
        void onScheduleClick(Psychologist psychologist);
        void onFavoriteClick(Psychologist psychologist);
    }

    public PsychologistAdapter(List<Psychologist> psychologistList, OnPsychologistClickListener listener) {
        this.psychologistList = psychologistList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public PsychologistViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_psychologist, parent, false);
        return new PsychologistViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PsychologistViewHolder holder, int position) {
        holder.bind(psychologistList.get(position));
    }

    @Override
    public int getItemCount() {
        return psychologistList.size();
    }

    class PsychologistViewHolder extends RecyclerView.ViewHolder {
        private final ImageView ivPsychologist;
        private final TextView tvName;
        private final TextView tvSpecialty;
        private final TextView tvExperience;
        private final TextView tvRating;
        private final TextView tvAvailability;
        private final ChipGroup chipGroupSpecializations;
        private final Button btnSchedule;
        private final ImageButton btnFavorite;

        public PsychologistViewHolder(@NonNull View itemView) {
            super(itemView);
            ivPsychologist = itemView.findViewById(R.id.iv_psychologist);
            tvName = itemView.findViewById(R.id.tv_name);
            tvSpecialty = itemView.findViewById(R.id.tv_specialty);
            tvExperience = itemView.findViewById(R.id.tv_experience);
            tvRating = itemView.findViewById(R.id.tv_rating);
            tvAvailability = itemView.findViewById(R.id.tv_availability);
            chipGroupSpecializations = itemView.findViewById(R.id.chip_group_specializations);
            btnSchedule = itemView.findViewById(R.id.btn_schedule);
            btnFavorite = itemView.findViewById(R.id.btn_favorite);
        }

        public void bind(final Psychologist psychologist) {
            tvName.setText(psychologist.getName());
            tvSpecialty.setText(psychologist.getSpecialty());

            String experience = psychologist.getYearsExperience() + " tahun pengalaman";
            tvExperience.setText(experience);

            String rating = String.format("%.1f", psychologist.getRating());
            tvRating.setText(rating);

            // Set availability text and style
            if (psychologist.isAvailableToday()) {
                tvAvailability.setText(R.string.available_today);
                tvAvailability.setTextColor(itemView.getContext().getColor(R.color.green_500));
            } else {
                tvAvailability.setText(R.string.available_tomorrow);
                tvAvailability.setTextColor(itemView.getContext().getColor(R.color.gray_500));
            }

            // Load psychologist image
            Glide.with(itemView.getContext())
                    .load(psychologist.getImageUrl())
                    .apply(RequestOptions.centerCropTransform())
                    .placeholder(R.drawable.ic_profile)
                    .error(R.drawable.ic_profile)
                    .into(ivPsychologist);

            // Setup specialization chips
            chipGroupSpecializations.removeAllViews();
            for (String specialization : psychologist.getSpecializations()) {
                Chip chip = (Chip) LayoutInflater.from(itemView.getContext())
                        .inflate(R.layout.item_specialization_chip, chipGroupSpecializations, false);
                chip.setText(specialization);
                chipGroupSpecializations.addView(chip);
            }

            // Set favorite button state
            updateFavoriteButton(psychologist.isFavorite());

            // Set button click listeners
            btnSchedule.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onScheduleClick(psychologist);
                }
            });

            btnFavorite.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onFavoriteClick(psychologist);
                    updateFavoriteButton(psychologist.isFavorite());
                }
            });
        }

        private void updateFavoriteButton(boolean isFavorite) {
            if (isFavorite) {
                btnFavorite.setImageResource(R.drawable.ic_heart_filled);
                btnFavorite.setColorFilter(itemView.getContext().getColor(R.color.red_500));
            } else {
                btnFavorite.setImageResource(R.drawable.ic_heart_outline);
                btnFavorite.setColorFilter(itemView.getContext().getColor(R.color.gray_400));
            }
        }
    }
}
