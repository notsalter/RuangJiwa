package com.example.ruangjiwa.ui.home;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Recommendation;

import java.util.List;

public class RecommendationAdapter extends RecyclerView.Adapter<RecommendationAdapter.RecommendationViewHolder> {

    private final List<Recommendation> recommendationList;
    private OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(Recommendation recommendation);
    }

    public RecommendationAdapter(List<Recommendation> recommendationList) {
        this.recommendationList = recommendationList;
    }

    public void setOnItemClickListener(OnItemClickListener listener) {
        this.listener = listener;
    }

    @NonNull
    @Override
    public RecommendationViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_recommendation, parent, false);
        return new RecommendationViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecommendationViewHolder holder, int position) {
        holder.bind(recommendationList.get(position));
    }

    @Override
    public int getItemCount() {
        return recommendationList.size();
    }

    class RecommendationViewHolder extends RecyclerView.ViewHolder {
        private final ImageView ivThumbnail;
        private final TextView tvType;
        private final TextView tvTitle;
        private final TextView tvDescription;
        private final ImageView ivTypeIcon;

        public RecommendationViewHolder(@NonNull View itemView) {
            super(itemView);
            ivThumbnail = itemView.findViewById(R.id.iv_thumbnail);
            tvType = itemView.findViewById(R.id.tv_type);
            tvTitle = itemView.findViewById(R.id.tv_title);
            tvDescription = itemView.findViewById(R.id.tv_description);
            ivTypeIcon = itemView.findViewById(R.id.iv_type_icon);

            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onItemClick(recommendationList.get(position));
                }
            });
        }

        public void bind(Recommendation recommendation) {
            tvTitle.setText(recommendation.getTitle());
            tvDescription.setText(recommendation.getDescription());

            // Load thumbnail image
            Glide.with(itemView.getContext())
                    .load(recommendation.getImageUrl())
                    .centerCrop()
                    .placeholder(R.drawable.placeholder_image)
                    .error(R.drawable.placeholder_image)
                    .into(ivThumbnail);

            // Set type-specific information (icon and label)
            switch (recommendation.getType()) {
                case AUDIO:
                    tvType.setText(R.string.self_talk_audio);
                    tvType.setTextColor(itemView.getContext().getColor(R.color.primary));
                    ivTypeIcon.setImageResource(R.drawable.ic_headphone);
                    ivTypeIcon.setColorFilter(itemView.getContext().getColor(R.color.primary));
                    break;
                case JOURNAL:
                    tvType.setText(R.string.journal_template);
                    tvType.setTextColor(itemView.getContext().getColor(R.color.secondary));
                    ivTypeIcon.setImageResource(R.drawable.ic_journal);
                    ivTypeIcon.setColorFilter(itemView.getContext().getColor(R.color.secondary));
                    break;
                case PSYCHOLOGIST:
                    tvType.setText(R.string.psychologist);
                    tvType.setTextColor(itemView.getContext().getColor(R.color.blue_500));
                    ivTypeIcon.setImageResource(R.drawable.ic_mental_health);
                    ivTypeIcon.setColorFilter(itemView.getContext().getColor(R.color.blue_500));
                    break;
            }
        }
    }
}
