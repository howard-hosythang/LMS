package com.library.shared.service.impl;

import java.io.UnsupportedEncodingException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.library.shared.service.EmailService;
import com.library.shared.templates.EmailTemplates;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

  private final JavaMailSender mailSender;

  @Value("${library.mail.noreply-address:${spring.mail.username}}")
  private String noreplyAddress;

  @Value("${library.mail.noreply-name:Library74 System}")
  private String noreplyName;

  @Value("${library.mail.support-address:support@library74.uk}")
  private String supportAddress;

  @Value("${library.mail.support-name:Library74's Support Center}")
  private String supportName;

  @Override
  public void sendEmail(String to, String fullName, String link, EmailTemplates emailTemplates)
      throws MessagingException, UnsupportedEncodingException {
    log.info("Sending email verification to {}", to);
    MimeMessage mimeMessage = mailSender.createMimeMessage();
    MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
    if (to.contains(",")) {
      messageHelper.setTo(InternetAddress.parse(to));
    } else {
      messageHelper.setTo(to);
    }
    messageHelper.setFrom(noreplyAddress, noreplyName);
    messageHelper.setSubject(emailTemplates.getSubject());

    String content = emailTemplates.formatContent(fullName, link, link, link);
    messageHelper.setText(content, true);
    mailSender.send(mimeMessage);
    log.info("Sending email to {} with subject: {}", to, emailTemplates.getSubject());
  }

  @Override
  public void sendEmailWithArgs(String to, EmailTemplates template, Object... args)
      throws MessagingException, UnsupportedEncodingException {
    MimeMessage mimeMessage = mailSender.createMimeMessage();
    MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
    messageHelper.setTo(to);
    messageHelper.setFrom(noreplyAddress, noreplyName);
    messageHelper.setSubject(template.getSubject());
    messageHelper.setText(template.formatContent(args), true);
    mailSender.send(mimeMessage);
    log.info("Sent email to {} with subject: {}", to, template.getSubject());
  }

  @Override
  public void sendSupportEmailWithArgs(String to, EmailTemplates template, Object... args)
      throws MessagingException, UnsupportedEncodingException {
    MimeMessage mimeMessage = mailSender.createMimeMessage();
    MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
    messageHelper.setTo(to);
    messageHelper.setFrom(supportAddress, supportName);
    messageHelper.setSubject(template.getSubject());
    messageHelper.setText(template.formatContent(args), true);
    mailSender.send(mimeMessage);
    log.info("Sent support email to {} with subject: {}", to, template.getSubject());
  }
}
