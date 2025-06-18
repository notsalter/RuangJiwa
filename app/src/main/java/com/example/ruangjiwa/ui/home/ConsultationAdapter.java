package com.example.ruangjiwa.ui.home;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Consultation;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class ConsultationAdapter extends RecyclerView.Adapter<ConsultationAdapter.ConsultationViewHolder> {

    private final List<Consultation> consultationList;
    private final ConsultationListener listener;

    public interface ConsultationListener {
        void onVideoCallClick(Consultation consultation);
        void onChatClick(Consultation consultation);
    }

    public ConsultationAdapter(List<Consultation> consultationList, ConsultationListener listener) {
        this.consultationList = consultationList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ConsultationViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_consultation, parent, false);
        return new ConsultationViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ConsultationViewHolder holder, int position) {
        Consultation consultation = consultationList.get(position);
        holder.bind(consultation);
    }

    @Override
    public int getItemCount() {
        return consultationList.size();
    }

    public class ConsultationViewHolder extends RecyclerView.ViewHolder {
        private final ImageView imgPsychologist;
        private final TextView tvPsychologistName;
        private final TextView tvPsychologistSpecialty;
        private final TextView tvDateTime;
        private final Button btnVideoCall;
        private final Button btnChat;

        public ConsultationViewHolder(@NonNull View itemView) {
            super(itemView);
            imgPsychologist = itemView.findViewById(R.id.img_psychologist);
            tvPsychologistName = itemView.findViewById(R.id.tv_psychologist_name);
            tvPsychologistSpecialty = itemView.findViewById(R.id.tv_psychologist_specialty);
            tvDateTime = itemView.findViewById(R.id.tv_consultation_date_time);
            btnVideoCall = itemView.findViewById(R.id.btn_video_call);
            btnChat = itemView.findViewById(R.id.btn_chat);
        }

        public void bind(final Consultation consultation) {
            // Set psychologist name and specialty
            tvPsychologistName.setText(consultation.getPsychologistName());
            tvPsychologistSpecialty.setText(consultation.getPsychologistSpecialty());

            // Format and set date
            SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, dd MMMM yyyy • HH:mm", new Locale("id", "ID"));
            String formattedDate = dateFormat.format(consultation.getDateTime());
            tvDateTime.setText(formattedDate);

            // Load psychologist image with Glide
            Glide.with(itemView.getContext())
                    .load(consultation.getPsychologistImageUrl())
                    .apply(RequestOptions.circleCropTransform())
                    .placeholder(R.drawable.ic_profile)
                    .error(R.drawable.ic_profile)
                    .into(imgPsychologist);

            // Set button click listeners
            btnVideoCall.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onVideoCallClick(consultation);
                }
            });

            btnChat.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onChatClick(consultation);
                }
            });
        }
    }
}
