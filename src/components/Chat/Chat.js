// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import PT from "prop-types";
import { CONTACT_STATUS } from "../../constants/global";
import ChatTranscriptor from "./ChatTranscriptor";
import ChatComposer from "./ChatComposer";
import ChatActionBar from "./ChatActionBar";
import React, { Component } from "react";
import { Text } from "connect-core";
import styled from "styled-components";

import renderHTML from "react-render-html";

const ChatWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  background: #3f5773;
  text-align: center;
  padding: 20px;
  color: #fff;
  border-radius: 3px;
  flex-shrink: 0;
`;
const WelcomeText = styled(Text)`
  padding-bottom: 10px;
`;

const defaultHeaderText = "Hi there! ";
const defaultHeaderDescription =
  "This is an example of how customers experience chat on your website";

const defaultHeaderConfig = {
  isHTML: false,
  render: () => {
    return (
      <HeaderWrapper>
        <WelcomeText type={"h2"}>{defaultHeaderText}</WelcomeText>
        <Text type={"p"}>{defaultHeaderDescription}</Text>
      </HeaderWrapper>
    );
  },
};

Header.defaultProps = {
  headerConfig: {},
};

function Header({ headerConfig }) {
  let config = Object.assign({}, defaultHeaderConfig, headerConfig);

  if (config.headerText || config.headerDescription) {
    config.render = () => {
      return (
        <HeaderWrapper>
          <WelcomeText type={"h2"}>
            {config.headerText || defaultHeaderText}
          </WelcomeText>
          <Text type={"p"}>
            {config.headerDescription || defaultHeaderDescription}
          </Text>
        </HeaderWrapper>
      );
    };
  }

  if (config.isHTML) {
    return renderHTML(config.render());
  } else {
    return config.render();
  }
}

const textInputRef = React.createRef();

export default class Chat extends Component {
  constructor(props) {
    super(props);
    console.log("Inside Chat Main Component", props);

    this.state = {
      transcript: [],
      typingParticipants: [],
      contactStatus: CONTACT_STATUS.DISCONNECTED,
    };
    this.updateTranscript = (transcript) => this.setState({ transcript });
    this.updateTypingParticipants = (typingParticipants) =>
      this.setState({ typingParticipants });
    this.updateContactStatus = (contactStatus) =>
      this.setState({ contactStatus });
  }

  static propTypes = {
    chatSession: PT.object.isRequired,
    composerConfig: PT.object,
    onEnded: PT.func,
  };

  static defaultProps = {
    onEnded: () => {},
  };

  componentDidMount() {
    this.init(this.props.chatSession);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.chatSession !== this.props.chatSession) {
      this.cleanUp(prevProps.chatSession);
      this.init(this.props.chatSession);
    }
  }

  componentWillUnmount() {
    this.cleanUp(this.props.chatSession);
  }

  init(chatSession) {
    this.setState({ contactStatus: chatSession.contactStatus });
    chatSession.on("transcript-changed", this.updateTranscript);
    chatSession.on(
      "typing-participants-changed",
      this.updateTypingParticipants
    );
    chatSession.on("contact-status-changed", this.updateContactStatus);
  }

  cleanUp(chatSession) {
    chatSession.off("transcript-changed", this.updateTranscript);
    chatSession.off(
      "typing-participants-changed",
      this.updateTypingParticipants
    );
    chatSession.off("contact-status-changed", this.updateContactStatus);
  }

  endChat() {
    this.props.chatSession.endChat();
    this.props.onEnded();
    if (this.props.footerConfig.onChatEnded) {
      this.props.footerConfig.onChatEnded();
    }
  }

  closeChat() {
    this.props.chatSession.closeChat();
  }

  render() {
    const {
      chatSession,
      headerConfig,
      transcriptConfig,
      composerConfig,
      footerConfig,
    } = this.props;
    console.log("MESSAGES", this.state.transcript);

    return (
      <ChatWrapper>
        {(this.state.contactStatus === CONTACT_STATUS.CONNECTED ||
          this.state.contactStatus === CONTACT_STATUS.CONNECTING ||
          this.state.contactStatus === CONTACT_STATUS.ENDED) && (
          <Header headerConfig={headerConfig} />
        )}

        <ChatTranscriptor
          loadPreviousTranscript={() => chatSession.loadPreviousTranscript()}
          addMessage={(data) => chatSession.addOutgoingMessage(data)}
          downloadAttachment={(attachmentId) =>
            chatSession.downloadAttachment(attachmentId)
          }
          transcript={this.state.transcript}
          typingParticipants={this.state.typingParticipants}
          contactStatus={this.state.contactStatus}
          contactId={chatSession.contactId}
          transcriptConfig={transcriptConfig}
          textInputRef={textInputRef}
        />
        <ChatComposer
          contactStatus={this.state.contactStatus}
          contactId={chatSession.contactId}
          addMessage={(contactId, data) => chatSession.addOutgoingMessage(data)}
          addAttachment={(contactId, attachment) =>
            chatSession.addOutgoingAttachment(attachment)
          }
          onTyping={() => chatSession.sendTypingEvent()}
          composerConfig={composerConfig}
          textInputRef={textInputRef}
        />
        {
          <ChatActionBar
            onEndChat={() => this.endChat()}
            onClose={() => this.closeChat()}
            contactStatus={this.state.contactStatus}
            footerConfig={footerConfig}
          />
        }
      </ChatWrapper>
    );
  }
}
