<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ShopEventNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $subject,
        private readonly string $greeting,
        private readonly array $lines,
        private readonly string $actionPath,
        private readonly string $actionLabel = 'Open tailoring account',
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->subject,
            'message' => implode(' ', $this->lines),
            'action_url' => $this->actionPath,
            'action_label' => $this->actionLabel,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url'), '/') . $this->actionPath;
        $mail = (new MailMessage())
            ->subject($this->subject)
            ->greeting($this->greeting);

        foreach ($this->lines as $line) {
            $mail->line($line);
        }

        return $mail->action($this->actionLabel, $url)
            ->line('This is an automated message from the Tailoring Management System.');
    }
}
